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

// Sirve tanto la clave nueva ("publishable", sb_publishable_…) como la antigua ("anon", eyJ…)
const cabeceras = () => ({
  apikey: SUPABASE_CLAVE,
  ...(SUPABASE_CLAVE.startsWith("eyJ") ? { Authorization: `Bearer ${SUPABASE_CLAVE}` } : {}),
  "Content-Type": "application/json",
});

// ---------- Cifrado rápido ----------
// Una sola clave para todos los comentarios (se calcula una vez),
// así cargar 200 "me gusta" no tarda nada.
const enc = new TextEncoder();
const dec = new TextDecoder();
const aB64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let clave = null;
let claveDe = null;
async function claveComentarios(password) {
  if (clave && claveDe === password) return clave;
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  clave = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("mochila-smx-comentarios-v2"), iterations: 310000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  claveDe = password;
  return clave;
}
async function cifrarFila(obj, password) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await claveComentarios(password), enc.encode(JSON.stringify(obj)));
  return { v: 2, iv: aB64(iv), datos: aB64(datos) };
}
async function descifrarFila(f, password) {
  if (f.v === 2) {
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(f.iv) }, await claveComentarios(password), deB64(f.datos));
    return JSON.parse(dec.decode(plano));
  }
  return descifrar(f, password); // formato antiguo
}

// ---------- Leer ----------
// Devuelve { porPost: { idPost: [ {id, tipo, nombre, rol, texto, disp, fecha} ] }, visitas: [...] }
export async function cargar(password) {
  if (!activos()) return { porPost: {}, visitas: [] };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?select=id,post,datos,creado&order=creado.asc&limit=2000`, { headers: cabeceras() });
  if (!r.ok) throw new Error("No se han podido cargar los comentarios.");
  const porPost = {};
  const visitas = [];
  const likesVistos = new Set();
  for (const f of await r.json()) {
    try {
      const c = { id: f.id, fecha: f.creado, tipo: "comentario", ...(await descifrarFila(f.datos, password)) };
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
async function guardarFila(post, obj, password) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: "POST",
    headers: { ...cabeceras(), Prefer: "return=minimal" },
    body: JSON.stringify({ post, datos: await cifrarFila({ ...obj, disp: dispositivo() }, password) }),
  });
  if (!r.ok) throw new Error("No se ha podido guardar. Revisa tu conexión.");
}

export const enviar = (post, { nombre, rol, texto }, password) =>
  guardarFila(post, { tipo: "comentario", nombre: nombre.slice(0, 60), rol: (rol || "").slice(0, 40), texto: texto.slice(0, 2000) }, password);

export const darLike = (post, { nombre, rol }, password) =>
  guardarFila(post, { tipo: "like", nombre: nombre.slice(0, 60), rol: (rol || "").slice(0, 40) }, password);

// Apunta una visita como mucho una vez al día por dispositivo
export async function apuntarVisita(yo, password) {
  if (!activos() || !yo) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const clave = "mochila-ultima-visita";
  try { if (localStorage.getItem(clave) === hoy) return; } catch {}
  try {
    await guardarFila(POST_VISITAS, { tipo: "visita", nombre: yo.nombre, rol: yo.rol || "" }, password);
    localStorage.setItem(clave, hoy);
  } catch {}
}

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
