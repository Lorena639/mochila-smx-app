// =============================================================
//  fichar.js — Página rápida de fichaje (fichar.html)
//  Enlace: fichar.html#k=CLAVE&lat=..&lon=..&r=..&n=NOMBRE[&auto=entrada|salida]
//  · Con "auto", ficha sola al abrirse (para Atajos / MacroDroid).
//  · Sin "auto", enseña los botones de entrada y salida.
//  · La configuración se recuerda en este navegador, así que luego
//    basta con abrir fichar.html.
// =============================================================
import * as A from "./asistencia.js";
import { cargarFichajes } from "./comentarios.js";

const $ = (s) => document.querySelector(s);
const GUARDADO = "mochila-fichaje";

function leerConfig() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get("k")) {
    const conf = { clave: p.get("k"), lat: Number(p.get("lat")), lon: Number(p.get("lon")), radio: Number(p.get("r")) || A.RADIO_DEFECTO, nombre: p.get("n") || "" };
    try { localStorage.setItem(GUARDADO, JSON.stringify(conf)); } catch {}
    return { conf, auto: p.get("auto") || "" };
  }
  try { return { conf: JSON.parse(localStorage.getItem(GUARDADO) || "null"), auto: "" }; } catch { return { conf: null, auto: "" }; }
}

const { conf, auto } = leerConfig();
// Quita la clave de la barra de direcciones (y del historial) nada más leerla
if (location.hash) history.replaceState(null, "", location.pathname);

const hora = (iso) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const hoy = () => new Date().toDateString();
const estado = (texto, clase = "") => { $("#estado").textContent = texto; $("#estado").className = `fichar-estado ${clase}`; };

async function yaFichado(accion) {
  try {
    const lista = await cargarFichajes(conf.clave);
    return lista.find((f) => f.accion === accion && new Date(f.creado).toDateString() === hoy()) || null;
  } catch { return null; }
}

async function hacer(accion, metodo) {
  $("#botones").querySelectorAll("button").forEach((b) => (b.disabled = true));
  estado("Comprobando tu ubicación…");
  try {
    const previo = await yaFichado(accion);
    if (previo && metodo === "auto") { estado(`Ya habías fichado la ${accion} hoy a las ${hora(previo.creado)}.`, "ok"); return; }
    await A.fichar({ accion, instituto: conf, clave: conf.clave, metodo });
    estado(`${accion === "entrada" ? "Entrada" : "Salida"} fichada a las ${hora(new Date().toISOString())}.`, "ok");
    if (navigator.vibrate) navigator.vibrate(120);
  } catch (err) {
    estado(err.message, "error");
  } finally {
    $("#botones").querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
}

if (!conf?.clave || !conf.lat) {
  estado("Este enlace no está configurado. Cópialo desde la app: Asistencia → Ajustes del fichaje.", "error");
} else {
  $("#titulo").textContent = conf.nombre ? `Fichar · ${conf.nombre}` : "Fichar";
  $("#botones").hidden = false;
  $("#pie").textContent = `Solo ficha a menos de ${conf.radio} m del instituto. La hora la pone el servidor.`;
  $("#botones").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-accion]");
    if (b) hacer(b.dataset.accion, "manual");
  });
  if (auto === "entrada" || auto === "salida") hacer(auto, "auto");
  else estado("Pulsa para fichar.");
}
