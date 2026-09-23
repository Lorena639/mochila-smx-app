// =============================================================
//  extras.js — Avisos, Google Calendar y copia de seguridad
// =============================================================
import { esc, hoyIso, diasHasta, completarDatos } from "./comun.js";
import { icono } from "./iconos.js";
import { clasesDeFecha, aMin, iso } from "./curso.js";
import { calcularFaltas, propuestas } from "./faltas.js";
import { pendientes } from "./estudio.js";
import { descargar } from "./estada.js";

// ---------- Centro de avisos ----------
// Devuelve [{nivel: "mal"|"aviso"|"info", texto, ir}]
export function calcularAvisos(e) {
  const d = e.datos;
  const hoy = hoyIso();
  const lista = [];
  const man = new Date(); man.setDate(man.getDate() + 1);
  const manana = iso(man);
  for (const ev of d.eventos) {
    if (!["Examen", "Entrega", "Recuperación", "Trámite"].includes(ev.tipo)) continue;
    const fin = ev.fechaFin || ev.fecha;
    if (ev.fecha === hoy) lista.push({ nivel: "mal", texto: `Hoy: ${ev.tipo.toLowerCase()} · ${ev.titulo}`, ir: "calendario" });
    else if (ev.fecha === manana) lista.push({ nivel: "aviso", texto: `Mañana: ${ev.tipo.toLowerCase()} · ${ev.titulo}`, ir: ev.tipo === "Examen" && e.editor ? `estudio/examen/${ev.id}` : "calendario" });
    else if (ev.tipo === "Trámite" && ev.fecha < hoy && fin >= hoy && diasHasta(fin) <= 3) lista.push({ nivel: "aviso", texto: `${ev.titulo}: acaba en ${diasHasta(fin)} días`, ir: "calendario" });
  }
  for (const t of d.trabajos) if (t.estado === "curso" && t.fecha && diasHasta(t.fecha) >= 0 && diasHasta(t.fecha) <= 1)
    lista.push({ nivel: diasHasta(t.fecha) === 0 ? "mal" : "aviso", texto: `${diasHasta(t.fecha) === 0 ? "Hoy" : "Mañana"} se entrega: ${t.titulo}`, ir: "trabajos" });
  if (e.ve?.("asistencia")) {
    for (const m of calcularFaltas(d)) if (m.estado === "mal" || m.estado === "perdida")
      lista.push({ nivel: "mal", texto: `${m.a.nombre.replace(/^\d{3,4}\s*/, "")}: ${m.estado === "perdida" ? "has superado el límite de faltas" : `solo quedan ${String(m.quedanFI).replace(".", ",")} h de margen`}`, ir: "asistencia" });
  }
  if (e.editor) {
    const clases = clasesDeFecha(d, hoy);
    const ahora = new Date().getHours() * 60 + new Date().getMinutes();
    const fichadoHoy = (e.fichajes || []).some((f) => f.accion === "entrada" && iso(new Date(f.creado)) === hoy);
    if (e.fichajes && clases.length && !fichadoHoy && ahora > aMin(clases[0].inicio) + 15 && ahora < aMin(clases[clases.length - 1].fin))
      lista.push({ nivel: "aviso", texto: "Hoy aún no has fichado la entrada", ir: "asistencia" });
    const p = propuestas(d, e.fichajes).length;
    if (p) lista.push({ nivel: "info", texto: `${p} ${p === 1 ? "día" : "días"} por revisar en asistencia`, ir: "asistencia" });
    const nuevos = (e.buzon || []).filter((m) => !d.buzonLeidos.includes(m.id)).length;
    if (nuevos) lista.push({ nivel: "info", texto: `${nuevos} ${nuevos === 1 ? "mensaje nuevo" : "mensajes nuevos"} en el buzón`, ir: "buzon" });
    const tj = pendientes(d).length;
    if (tj) lista.push({ nivel: "info", texto: `${tj} tarjetas para repasar hoy`, ir: "estudio/tarjetas" });
  }
  // Novedades del foro desde la última visita
  const ultima = leerVisto();
  const nuevosTemas = (e.foro?.temas || []).filter((t) => t.fecha > ultima && !d.foro.ocultos.includes(t.id)).length;
  if (nuevosTemas) lista.push({ nivel: "info", texto: `${nuevosTemas} ${nuevosTemas === 1 ? "tema nuevo" : "temas nuevos"} en la comunidad`, ir: "comunidad" });
  return lista;
}
const CLAVE_VISTO = "mochila-foro-visto";
const leerVisto = () => { try { return localStorage.getItem(CLAVE_VISTO) || "2000"; } catch { return "2000"; } };
export const marcarForoVisto = () => { try { localStorage.setItem(CLAVE_VISTO, new Date().toISOString()); } catch {} };

export function htmlPanelAvisos(avisos) {
  return `<div class="panel-avisos" role="dialog" aria-label="Avisos">
    <div class="pa-cab"><b>Avisos</b><button type="button" class="boton icono peque" data-accion="avisos-cerrar" aria-label="Cerrar">${icono("cerrar")}</button></div>
    ${avisos.length ? avisos.map((a) => `<button type="button" class="aviso-item ${a.nivel}" data-ir="${esc(a.ir)}"><span class="punto"></span><span>${esc(a.texto)}</span></button>`).join("")
      : `<p class="texto-suave">Todo al día. No tienes avisos.</p>`}
    ${"Notification" in window && Notification.permission === "default" ? `<button type="button" class="enlace-ver" data-accion="avisos-sistema">Mostrar también como notificaciones del sistema</button>` : ""}
  </div>`;
}

// Al abrir la app: una notificación del sistema con lo importante (una vez al día)
export function notificarAlAbrir(avisos) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const k = "mochila-notificado";
    if (localStorage.getItem(k) === hoyIso()) return;
    const imp = avisos.filter((a) => a.nivel !== "info");
    if (!imp.length) return;
    new Notification("Mochila SMX", { body: imp.slice(0, 3).map((a) => a.texto).join("\n"), icon: "img/icono-192.png", tag: "mochila-dia" });
    localStorage.setItem(k, hoyIso());
  } catch {}
}

// ---------- Google Calendar ----------
const compacta = (f) => f.replace(/-/g, "");
const sumar1 = (f) => { const x = new Date(f + "T00:00:00"); x.setDate(x.getDate() + 1); return iso(x); };
export function enlaceGoogle(ev) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: ev.titulo, dates: `${compacta(ev.fecha)}/${compacta(sumar1(ev.fechaFin || ev.fecha))}`, details: [ev.tipo, ev.nota].filter(Boolean).join(" · ") });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
export function exportarICS(d) {
  const esc2 = (t) => String(t || "").replace(/[,;\\]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const ahora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mochila SMX//ES", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Mochila SMX"];
  for (const ev of d.eventos) {
    lineas.push("BEGIN:VEVENT", `UID:${ev.id}@mochila-smx`, `DTSTAMP:${ahora}`, `DTSTART;VALUE=DATE:${compacta(ev.fecha)}`, `DTEND;VALUE=DATE:${compacta(sumar1(ev.fechaFin || ev.fecha))}`,
      `SUMMARY:${esc2(`${ev.tipo === "Examen" ? "Examen: " : ev.tipo === "Entrega" ? "Entrega: " : ""}${ev.titulo}`)}`, `DESCRIPTION:${esc2([ev.tipo, ev.nota].filter(Boolean).join(" · "))}`);
    if (["Examen", "Entrega"].includes(ev.tipo)) lineas.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Recordatorio", "TRIGGER:-PT15H", "END:VALARM");
    lineas.push("END:VEVENT");
  }
  for (const t of d.trabajos) if (t.fecha && t.estado === "curso") {
    lineas.push("BEGIN:VEVENT", `UID:tr-${t.id}@mochila-smx`, `DTSTAMP:${ahora}`, `DTSTART;VALUE=DATE:${compacta(t.fecha)}`, `DTEND;VALUE=DATE:${compacta(sumar1(t.fecha))}`,
      `SUMMARY:${esc2(`Entrega: ${t.titulo}`)}`, "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Recordatorio", "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT");
  }
  lineas.push("END:VCALENDAR");
  descargar("mochila-smx.ics", lineas.join("\r\n"), "text/calendar");
}

// ---------- Copia de seguridad ----------
export function descargarCopia(d) {
  const f = hoyIso();
  descargar(`mochila-smx-copia-${f}.json`, JSON.stringify({ app: "mochila-smx", version: 1, fecha: new Date().toISOString(), datos: d }, null, 2), "application/json");
}
export async function leerCopia(archivo) {
  const j = JSON.parse(await archivo.text());
  if (j.app !== "mochila-smx" || !j.datos?.config) throw new Error("Este archivo no es una copia de Mochila SMX.");
  return completarDatos(j.datos);
}

// ---------- Página de ajustes ----------
export function vistaAjustes(e) {
  const d = e.datos;
  const c = d.config;
  const fc = c.fechasCurso || {};
  return `<header class="cabecera-seccion"><div><h1>Ajustes</h1><p>Tu perfil, quién ve qué, avisos y copias de seguridad.</p></div></header>
    <div class="rejilla-ajustes">
      <section class="panel"><div class="panel-titulo"><h2>${icono("persona")} Perfil</h2></div>
        <p class="texto-suave">Nombre, curso, frase de presentación y foto.</p>
        <button class="boton" type="button" data-accion="perfil">Editar perfil</button>
        <div class="rejilla-form" style="margin-top:14px">
          <div class="campo"><label for="ajNombre">Nombre completo (para los emails)</label><input id="ajNombre" data-cambio="config" data-k="nombreCompleto" value="${esc(c.nombreCompleto || "")}"></div>
          <div class="campo"><label for="ajTutor">Email del tutor/a</label><input id="ajTutor" type="email" data-cambio="config" data-k="tutorEmail" value="${esc(c.tutorEmail || "")}"></div>
        </div>
        <p class="nota-pie">Los emails de cada profe se ponen en «Editar materia».</p></section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("grupos")} Compartir por grupos</h2></div>
        <p class="texto-suave">Contraseñas de Familia, Profes y Amigos, y qué ve cada uno.</p>
        <div class="fila-botones"><button class="boton principal" type="button" data-accion="grupos">Configurar grupos</button>
          <button class="boton" type="button" data-accion="vercomo">${icono("ojo")} Ver como…</button></div></section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("calendario")} Curso y calendario</h2></div>
        <div class="rejilla-form"><div class="campo"><label for="ajIni">Primer día de clase</label><input id="ajIni" type="date" data-cambio="fechas-curso" data-k="inicio" value="${esc(fc.inicio || "")}"></div>
          <div class="campo"><label for="ajFin">Último día de clase</label><input id="ajFin" type="date" data-cambio="fechas-curso" data-k="fin" value="${esc(fc.fin || "")}"></div></div>
        <p class="texto-suave">Con estas fechas, el horario y los festivos se calculan las horas de cada módulo.</p>
        <div class="fila-botones"><button class="boton" type="button" data-accion="ics">${icono("descargar")} Exportar a Google Calendar (.ics)</button></div>
        <p class="nota-pie">En Google Calendar: Configuración → Importar y exportar → Importar → elige el archivo. Los exámenes y entregas llevan aviso la tarde anterior.</p></section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("campana")} Avisos</h2></div>
        <p class="texto-suave">La campana de arriba reúne exámenes y entregas cercanos, faltas, mensajes y novedades del foro.</p>
        ${"Notification" in window ? (Notification.permission === "granted" ? `<p><span class="chip ok">Activadas</span> Al abrir la app te llegará una notificación con lo importante del día.</p>`
          : `<button class="boton" type="button" data-accion="avisos-sistema">Activar notificaciones del sistema</button>`) : `<p class="texto-suave">Este navegador no admite notificaciones.</p>`}
      </section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("descargar")} Copia de seguridad</h2></div>
        <p class="texto-suave">Descarga todo tu contenido (sin los archivos adjuntos, que siguen en GitHub). Guárdala en un sitio seguro: va <b>sin cifrar</b>.</p>
        <div class="fila-botones"><button class="boton" type="button" data-accion="copia-descargar">${icono("descargar")} Descargar copia</button>
          <label class="boton">${icono("subir")} Restaurar copia<input type="file" accept=".json,application/json" hidden data-restaurar></label></div></section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("candado")} Seguridad</h2></div>
        <div class="fila-botones"><button class="boton" type="button" data-accion="password">Cambiar contraseña principal</button>
          <button class="boton" type="button" data-accion="salir">Cerrar sesión</button></div></section>
    </div>`;
}

export const acciones = {
  "ics"(b, api) { exportarICS(api.datos()); api.aviso("Calendario descargado. Impórtalo en Google Calendar."); },
  "copia-descargar"(b, api) { descargarCopia(api.datos()); },
  async "avisos-sistema"(b, api) {
    try { const p = await Notification.requestPermission(); api.aviso(p === "granted" ? "Notificaciones activadas" : "No se han activado las notificaciones"); } catch {}
    api.pintar();
  },
};
export const cambios = {
  "config"(el, api) { api.datos().config[el.dataset.k] = el.value.trim(); api.cambiar(false); },
  "fechas-curso"(el, api) { const c = api.datos().config; c.fechasCurso ||= {}; c.fechasCurso[el.dataset.k] = el.value; api.cambiar(); },
};
