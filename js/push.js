// =============================================================
//  push.js — Notificaciones en el móvil (aunque la app esté cerrada)
//  Habla con la función "avisos" de Supabase (supabase/functions/avisos).
//  · activar(): pide permiso y apunta este móvil
//  · programar(): sube los recordatorios de exámenes, entregas y faltas
// =============================================================
import { SUPABASE_URL, SUPABASE_CLAVE } from "./config.js";
import { calcularFaltas } from "./faltas.js";

const MARCA = "mochila-push";

export const soportado = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
export const instalada = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// Clave de avisos: la tuya (admin) o la que viene en el paquete de Familia
export const claveDe = (api) => api.claves?.()?.avisos || null;

// Nueva clave aleatoria (24 bytes, base64url)
export function nuevaClave() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function llamar(clave, cuerpo) {
  if (!SUPABASE_URL) throw new Error("Falta configurar Supabase.");
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}/functions/v1/avisos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_CLAVE,
        ...(SUPABASE_CLAVE.startsWith("eyJ") ? { Authorization: `Bearer ${SUPABASE_CLAVE}` } : {}),
        "x-avisos": clave,
      },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error("No se puede conectar con la función «avisos». ¿Está creada en Supabase y con «Verify JWT» desactivado?");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(r.status === 404 ? "No existe la función «avisos» en Supabase." : j.error || j.message || j.msg || `La función de avisos respondió ${r.status}.`);
    e.status = r.status;
    throw e;
  }
  return j;
}

const aBytes = (b64u) => {
  const s = atob(b64u.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64u.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};
const mismaClave = (buf, b64u) => {
  if (!buf) return false;
  const a = new Uint8Array(buf), b = aBytes(b64u);
  return a.length === b.length && a.every((x, i) => x === b[i]);
};

export async function suscripcion() {
  if (!soportado()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}
export async function activo() {
  try { return Notification.permission === "granted" && Boolean(await suscripcion()); } catch { return false; }
}

export async function activar(clave, quien) {
  if (!clave) throw new Error("Aún no están preparadas las notificaciones.");
  if (!soportado()) {
    throw new Error(esIphone() && !instalada()
      ? "En iPhone primero añade la app a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y ábrela desde ahí."
      : "Este navegador no admite notificaciones push.");
  }
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") throw new Error("No has dado permiso. Actívalo en los ajustes del navegador para esta web.");
  const { publica } = await llamar(clave, { accion: "publica" });
  const reg = await navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !mismaClave(sub.options?.applicationServerKey, publica)) { await sub.unsubscribe(); sub = null; }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(publica) });
  await llamar(clave, { accion: "suscribir", sub: sub.toJSON(), quien: String(quien || "").slice(0, 40) });
  try { localStorage.setItem(MARCA, "1"); } catch {}
  return true;
}

export async function desactivar(clave) {
  const sub = await suscripcion();
  if (sub) {
    try { await llamar(clave, { accion: "baja", endpoint: sub.endpoint }); } catch {}
    await sub.unsubscribe();
  }
  try { localStorage.removeItem(MARCA); } catch {}
}

export const probar = (clave) => llamar(clave, { accion: "probar" });
export const estado = (clave) => llamar(clave, { accion: "estado" });

// ---------- Recordatorios ----------
// Exámenes, entregas, recuperaciones y trámites: la tarde antes (20:00) y el mismo día (7:30).
// Trabajos en curso: igual. Faltas: en cuanto un módulo se acerca al límite.
// Solo lo que puede ver Familia (lo marcado "Solo yo" o sin Familia no se manda).
const visibleFamilia = (x) => !Array.isArray(x?.visible) || x.visible.includes("familia");
const enFecha = (fecha, hora, diasAntes = 0) => {
  const d = new Date(`${fecha}T${hora}:00`);
  d.setDate(d.getDate() - diasAntes);
  return d;
};
const corto = (s) => String(s || "").replace(/^\d{3,4}\s*/, "");

export function calcularRecordatorios(d) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + 60 * 86400 * 1000);
  const lista = [];
  const poner = (id, cuando, titulo, texto, url) => { if (cuando > ahora && cuando < limite) lista.push({ id, cuando: cuando.toISOString(), titulo, texto, url }); };
  for (const ev of d.eventos || []) {
    if (!["Examen", "Entrega", "Recuperación", "Trámite"].includes(ev.tipo) || !ev.fecha || !visibleFamilia(ev)) continue;
    const que = `${ev.tipo}: ${ev.titulo}`;
    poner(`ev-${ev.id}-${ev.fecha}-v`, enFecha(ev.fecha, "20:00", 1), "Mañana", que, "./#calendario");
    poner(`ev-${ev.id}-${ev.fecha}-h`, enFecha(ev.fecha, "07:30"), "Hoy", que, "./#calendario");
  }
  for (const t of d.trabajos || []) {
    if (t.estado !== "curso" || !t.fecha || !visibleFamilia(t)) continue;
    poner(`tr-${t.id}-${t.fecha}-v`, enFecha(t.fecha, "20:00", 1), "Mañana se entrega", t.titulo, "./#trabajos");
    poner(`tr-${t.id}-${t.fecha}-h`, enFecha(t.fecha, "07:30"), "Hoy se entrega", t.titulo, "./#trabajos");
  }
  try {
    for (const m of calcularFaltas(d)) {
      if (m.estado !== "mal" && m.estado !== "perdida") continue;
      const cuando = new Date(ahora.getTime() - 60 * 1000); // ya: sale en la próxima vuelta del cron
      const texto = m.estado === "perdida" ? "Se ha superado el límite de faltas" : `Solo quedan ${String(m.quedanFI).replace(".", ",")} h de margen`;
      lista.push({ id: `faltas-${m.a.id}-${m.estado}`, cuando: cuando.toISOString(), titulo: `Faltas · ${corto(m.a.nombre)}`, texto, url: "./#asistencia" });
    }
  } catch { /* sin datos de asistencia */ }
  // Novedades de las últimas 3 h (salen en la próxima vuelta del cron, como mucho 15 min)
  for (const n of d.config?.novedades || []) {
    if (Date.now() - n.t < 3 * 3600 * 1000) lista.push({ id: `nov-${n.id}`, cuando: new Date(n.t).toISOString(), titulo: n.titulo, texto: n.texto, url: n.url });
  }
  return lista;
}

// ---------- Novedades: cuando añades algo nuevo, aviso a ti y a Familia ----------
const COLECCIONES = [
  ["posts", "Nuevo en Día a día", "./#diario"],
  ["apuntes", "Nuevos apuntes", "./#materias"],
  ["trabajos", "Nuevo trabajo", "./#trabajos"],
  ["formacion", "Nueva formación", "./#formacion"],
  ["eventos", "Nueva fecha en el calendario", "./#calendario"],
];
export const idsDe = (d) => new Set(COLECCIONES.flatMap(([col]) => (d[col] || []).map((x) => `${col}:${x.id}`)));
// Apunta en d.config.novedades lo que no estaba en "conocidos". Devuelve cuántas.
export function apuntarNovedades(d, conocidos) {
  if (d.config.avisarNovedades === false) return 0;
  const lista = (d.config.novedades ||= []).filter((n) => Date.now() - n.t < 24 * 3600 * 1000);
  let n = 0;
  for (const [col, titulo, url] of COLECCIONES) {
    for (const x of d[col] || []) {
      const k = `${col}:${x.id}`;
      if (conocidos.has(k)) continue;
      conocidos.add(k);
      if (String(x.id).startsWith("of-") || !visibleFamilia(x)) continue;
      const nombre = x.titulo || x.nombre || "";
      if (!nombre) continue;
      lista.push({ id: k.replace(":", "-"), t: Date.now(), titulo, texto: String(nombre).slice(0, 120), url });
      n++;
    }
  }
  d.config.novedades = lista.slice(-40);
  return n;
}

let ultimaHuella = "";
export async function programar(clave, d) {
  if (!clave) return;
  const lista = calcularRecordatorios(d);
  // La hora exacta de las faltas cambia en cada llamada: no cuenta para la huella
  const huella = JSON.stringify(lista.map((r) => r.id.startsWith("faltas-") ? r.id : [r.id, r.cuando, r.titulo, r.texto]));
  if (huella === ultimaHuella) return;
  await llamar(clave, { accion: "programar", recordatorios: lista });
  ultimaHuella = huella;
}
