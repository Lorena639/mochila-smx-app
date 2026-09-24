// =============================================================
//  comentarios.js — Comentarios, "me gusta" y registro de visitas
//  Se guardan en Supabase CIFRADOS con la contraseña de la web:
//  solo quien tiene la contraseña puede leerlos o escribirlos.
//  Cada fila es { post, datos } y "datos" lleva dentro:
//    { tipo: "comentario" | "like" | "visita", nombre, rol, texto, disp }
// =============================================================
import { SUPABASE_URL, SUPABASE_CLAVE } from "./config.js";
import { descifrar, nuevoId } from "./comun.js";

export const activos = () => Boolean(SUPABASE_URL && SUPABASE_CLAVE);
export const POST_VISITAS = "_visitas";
export const POST_FICHAJES = "_fichajes";

// Sirve tanto la clave nueva ("publishable", sb_publishable_…) como la antigua ("anon", eyJ…)
const cabeceras = () => ({
  apikey: SUPABASE_CLAVE,
  ...(SUPABASE_CLAVE.startsWith("eyJ") ? { Authorization: `Bearer ${SUPABASE_CLAVE}` } : {}),
  "Content-Type": "application/json",
});

// ---------- Cifrado rápido ----------
// "acceso" puede ser la contraseña (texto) o { clave: "base64" }.
// Con la contraseña se deriva siempre la misma clave (sal fija), así que
// quien entra con un grupo recibe esa clave ya calculada y lee lo mismo.
export const SAL_COMENTARIOS = "mochila-smx-comentarios-v2";
const enc = new TextEncoder();
const dec = new TextDecoder();
const aB64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const claves = new Map();
function claveDe(acceso) {
  const id = typeof acceso === "string" ? "p|" + acceso : "k|" + acceso.clave;
  if (!claves.has(id)) {
    claves.set(id, (async () => {
      if (typeof acceso !== "string") return crypto.subtle.importKey("raw", deB64(acceso.clave), "AES-GCM", false, ["encrypt", "decrypt"]);
      const base = await crypto.subtle.importKey("raw", enc.encode(acceso), "PBKDF2", false, ["deriveKey"]);
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(SAL_COMENTARIOS), iterations: 310000, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    })());
  }
  return claves.get(id);
}
async function cifrarFila(obj, acceso) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await claveDe(acceso), enc.encode(JSON.stringify(obj)));
  return { v: 2, iv: aB64(iv), datos: aB64(datos) };
}
async function descifrarFila(f, acceso) {
  if (f.v === 2) {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(f.iv) }, await claveDe(acceso), deB64(f.datos));
    return JSON.parse(dec.decode(plano));
  }
  if (typeof acceso !== "string") throw new Error("formato antiguo");
  return descifrar(f, acceso); // formato antiguo
}

// ---------- Leer ----------
// Devuelve { porPost: { idPost: [ {id, tipo, nombre, rol, texto, disp, fecha} ] }, visitas: [...] }
export async function cargar(acceso) {
  if (!activos()) return { porPost: {}, visitas: [] };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?select=id,post,datos,creado&post=not.in.(${POST_FICHAJES},_foro,_buzon,_buzon_r)&order=creado.desc&limit=3000`, { headers: cabeceras() });
  if (!r.ok) throw new Error("No se han podido cargar los comentarios.");
  const porPost = {};
  const visitas = [];
  const likesVistos = new Set();
  // Se piden las 3000 más recientes y se recorren de la más antigua a la más nueva
  for (const f of (await r.json()).reverse()) {
    try {
      const c = { id: f.id, fecha: f.creado, tipo: "comentario", ...(await descifrarFila(f.datos, acceso)) };
      if (c.tipo === "visita") { visitas.push(c); continue; }
      if (c.tipo === "like") {
        const k = `${f.post}|${c.disp || c.nombre}`;
        if (likesVistos.has(k)) continue; // un "me gusta" por dispositivo
        likesVistos.add(k);
      }
      (porPost[f.post] ||= []).push(c);
    } catch { /* escrito con otra contraseña: se ignora */ }
  }
  return { porPost, visitas: visitas.reverse() };
}

// ---------- Escribir ----------
async function guardarFila(post, obj, acceso, aviso = null) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: "POST",
    headers: { ...cabeceras(), Prefer: "return=minimal" },
    body: JSON.stringify({ post, datos: { ...(await cifrarFila({ ...obj, disp: dispositivo() }, acceso)), ...(aviso ? { aviso } : {}) } }),
  });
  if (!r.ok) throw new Error("No se ha podido guardar. Revisa tu conexión.");
}

export const enviar = (post, { nombre, rol, texto }, acceso) =>
  guardarFila(post, { tipo: "comentario", nombre: nombre.slice(0, 60), rol: (rol || "").slice(0, 40), texto: texto.slice(0, 2000) }, acceso, "comentario");

export const darLike = (post, { nombre, rol }, acceso) =>
  guardarFila(post, { tipo: "like", nombre: nombre.slice(0, 60), rol: (rol || "").slice(0, 40) }, acceso);

// Apunta una visita cada vez que alguien abre la app (como mucho una cada 2 horas por dispositivo)
export async function apuntarVisita(yo, acceso) {
  if (!activos() || !yo) return;
  const clave = "mochila-ultima-visita";
  try { const u = Number(localStorage.getItem(clave)); if (u && Date.now() - u < 2 * 3600 * 1000) return; } catch {}
  try {
    await guardarFila(POST_VISITAS, { tipo: "visita", nombre: yo.nombre, rol: yo.rol || "" }, acceso);
    localStorage.setItem(clave, String(Date.now()));
  } catch {}
}

// ---------- Fichajes (asistencia) ----------
// Van en la misma tabla, con su propia clave: solo la tienen tú y los
// grupos a los que dejes ver "Asistencia".
// "creado" solo se pasa al añadir a mano un día pasado (queda marcado como "manual")
export async function guardarFichaje(registro, claveFichajes, creado = null) {
  if (!activos()) throw new Error("Falta configurar Supabase.");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: "POST",
    headers: { ...cabeceras(), Prefer: "return=minimal" },
    // "aviso" (sin cifrar) solo dice si es entrada o salida, para la notificación push.
    // Los fichajes de días pasados no lo llevan: no avisan.
    body: JSON.stringify({ post: POST_FICHAJES, datos: { ...(await cifrarFila({ ...registro, disp: dispositivo() }, { clave: claveFichajes })), ...(creado ? {} : { aviso: registro.accion }) }, ...(creado ? { creado } : {}) }),
  });
  if (!r.ok) throw new Error("No se ha podido guardar el fichaje. Revisa tu conexión.");
}

export async function cargarFichajes(claveFichajes) {
  if (!activos() || !claveFichajes) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?select=id,datos,creado&post=eq.${POST_FICHAJES}&order=creado.desc&limit=1000`, { headers: cabeceras() });
  if (!r.ok) throw new Error("No se han podido cargar los fichajes.");
  const lista = [];
  for (const f of await r.json()) {
    try {
      const d = await descifrarFila(f.datos, { clave: claveFichajes });
      if (d.tipo === "fichaje") lista.push({ id: f.id, creado: f.creado, ...d });
    } catch { /* no es nuestro: se ignora */ }
  }
  return lista;
}

// ---------- Filas genéricas (foro, buzón…) ----------
// "datos" ya va cifrado por quien llama
export async function insertarFila(post, datos) {
  if (!activos()) throw new Error("Falta configurar Supabase.");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: "POST",
    headers: { ...cabeceras(), Prefer: "return=minimal" },
    body: JSON.stringify({ post, datos }),
  });
  if (!r.ok) throw new Error("No se ha podido enviar. Revisa tu conexión.");
}
export async function leerFilas(post, limite = 1000) {
  if (!activos()) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?select=id,datos,creado&post=eq.${encodeURIComponent(post)}&order=creado.asc&limit=${limite}`, { headers: cabeceras() });
  if (!r.ok) throw new Error("No se ha podido cargar.");
  return r.json();
}
export { dispositivo };

// ---------- "Cuenta" del dispositivo ----------
// Nombre y rol de quien usa este navegador (sin email, se queda guardado aquí)
const CLAVE = "mochila-comentarista";
export const quienSoy = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { return null; } };
export const guardarQuienSoy = (p) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch {} };
export const olvidarQuienSoy = () => { try { localStorage.removeItem(CLAVE); } catch {} };

// Identificador anónimo de este dispositivo (para no contar dos veces el mismo "me gusta")
function dispositivo() {
  try {
    let id = localStorage.getItem("mochila-dispositivo");
    if (!id) { id = nuevoId(); localStorage.setItem("mochila-dispositivo", id); }
    return id;
  } catch { return "sin-id"; }
}

// "Me gusta" que ya he dado desde este dispositivo
const CLAVE_LIKES = "mochila-mis-likes";
export const misLikes = () => { try { return new Set(JSON.parse(localStorage.getItem(CLAVE_LIKES) || "[]")); } catch { return new Set(); } };
export const guardarMisLikes = (set) => { try { localStorage.setItem(CLAVE_LIKES, JSON.stringify([...set])); } catch {} };
