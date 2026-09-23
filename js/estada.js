// =============================================================
//  estada.js — Diario de la Estada a l'empresa (prácticas)
//   Empresa, tutores, horas hechas / horas necesarias y registro diario.
// =============================================================
import { esc, nuevoId, hoyIso } from "./comun.js";
import { icono } from "./iconos.js";

const vacia = () => ({ empresa: "", direccion: "", tutorEmpresa: "", tutorCentro: "", horasObjetivo: "", inicio: "", fin: "", horario: "", registros: [] });
const n = (v) => Number(String(v || 0).replace(",", ".")) || 0;
const h = (x) => String(Math.round(x * 10) / 10).replace(".", ",");

export function vistaEstada(e) {
  const d = e.datos;
  const s = d.estada || vacia();
  const hechas = s.registros.reduce((a, r) => a + n(r.horas), 0);
  const objetivo = n(s.horasObjetivo);
  const pct = objetivo ? Math.min(100, (hechas / objetivo) * 100) : 0;
  const regs = [...s.registros].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const campo = (k, label, tipo = "text", ph = "") => `<div class="campo"><label for="es-${k}">${label}</label><input id="es-${k}" type="${tipo}" data-cambio="estada-campo" data-k="${k}" value="${esc(s[k] || "")}" placeholder="${esc(ph)}"></div>`;
  return `<header class="cabecera-seccion"><div><h1>Estada a l'empresa</h1><p>Tu diario de prácticas: horas, tareas y datos de contacto.</p></div></header>
    <div class="kpis">
      <div class="panel kpi"><span class="kpi-num">${h(hechas)}<small> h</small></span><span class="kpi-que">hechas${objetivo ? ` de ${h(objetivo)} h` : ""}</span></div>
      <div class="panel kpi"><span class="kpi-num">${objetivo ? h(Math.max(0, objetivo - hechas)) : "—"}<small> h</small></span><span class="kpi-que">por hacer</span></div>
      <div class="panel kpi"><span class="kpi-num">${s.registros.length}</span><span class="kpi-que">días registrados</span></div>
    </div>
    ${objetivo ? `<div class="progreso"><i style="width:${pct}%"></i></div>` : ""}
    <div class="rejilla-2">
      <section class="panel"><div class="panel-titulo"><h2>${icono("mas")} Registrar un día</h2></div>
        <form class="rejilla-form" data-form="estada-dia">
          <div class="campo"><label for="edF">Fecha</label><input id="edF" type="date" name="fecha" required value="${hoyIso()}"></div>
          <div class="campo"><label for="edH">Horas</label><input id="edH" name="horas" required inputmode="decimal" placeholder="p. ej. 6"></div>
          <div class="campo ancho"><label for="edT">Qué he hecho</label><textarea id="edT" name="tareas" rows="4" required placeholder="p. ej. Instalación de 5 equipos, configuración de impresoras en red…"></textarea></div>
          <div class="campo ancho"><label for="edA">Qué he aprendido (opcional)</label><input id="edA" name="aprendido"></div>
          <div class="fila-botones"><button class="boton principal" type="submit">Guardar día</button></div>
        </form></section>
      <section class="panel"><div class="panel-titulo"><h2>${icono("maletin")} Datos de las prácticas</h2></div>
        <div class="rejilla-form">${campo("empresa", "Empresa")}${campo("direccion", "Dirección")}${campo("tutorEmpresa", "Tutor/a en la empresa")}${campo("tutorCentro", "Tutor/a del centro")}
          ${campo("horasObjetivo", "Horas necesarias", "text", "p. ej. 150")}${campo("horario", "Horario", "text", "p. ej. L-V 9:00-14:00")}${campo("inicio", "Inicio", "date")}${campo("fin", "Fin", "date")}</div>
      </section>
    </div>
    <section class="panel"><div class="panel-titulo"><h2>${icono("calendario")} Diario</h2>
      ${regs.length ? `<button class="enlace-ver" type="button" data-accion="estada-exportar">${icono("descargar")} Descargar para la memoria</button>` : ""}</div>
      ${regs.length ? `<div class="diario-estada">${regs.map((r) => `<article class="de-dia"><header><b>${new Date(r.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</b>
          <span class="chip">${h(n(r.horas))} h</span><button class="boton icono peque" type="button" data-accion="estada-quitar" data-id="${esc(r.id)}" aria-label="Quitar">${icono("cerrar")}</button></header>
          <p>${esc(r.tareas).replace(/\n/g, "<br>")}</p>${r.aprendido ? `<p class="texto-suave">Aprendido: ${esc(r.aprendido)}</p>` : ""}</article>`).join("")}</div>`
        : `<p class="texto-suave">Cuando empieces las prácticas, apunta aquí cada día. Te servirá para la memoria final.</p>`}
    </section>`;
}

export const formularios = {
  "estada-dia"(form, api) {
    const d = api.datos();
    d.estada ||= vacia();
    const f = new FormData(form);
    d.estada.registros.push({ id: nuevoId(), fecha: f.get("fecha"), horas: String(f.get("horas")).replace(",", "."), tareas: String(f.get("tareas")).trim(), aprendido: String(f.get("aprendido") || "").trim() });
    api.cambiar();
    api.aviso("Día guardado");
  },
};
export const cambios = {
  "estada-campo"(el, api) { const d = api.datos(); d.estada ||= vacia(); d.estada[el.dataset.k] = el.value; api.cambiar(false); },
};
export const acciones = {
  "estada-quitar"(b, api) { const s = api.datos().estada; s.registros = s.registros.filter((r) => r.id !== b.dataset.id); api.cambiar(); },
  "estada-exportar"(b, api) {
    const s = api.datos().estada;
    const regs = [...s.registros].sort((a, b2) => a.fecha.localeCompare(b2.fecha));
    const html = `<html><head><meta charset="utf-8"><title>Diario de prácticas</title></head><body style="font-family:Calibri,Arial">
      <h1>Diario de la Estada a l'empresa</h1><p><b>Empresa:</b> ${esc(s.empresa)}<br><b>Tutor/a empresa:</b> ${esc(s.tutorEmpresa)}<br><b>Tutor/a centro:</b> ${esc(s.tutorCentro)}</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Fecha</th><th>Horas</th><th>Tareas</th><th>Aprendido</th></tr>
      ${regs.map((r) => `<tr><td>${esc(r.fecha)}</td><td>${esc(r.horas)}</td><td>${esc(r.tareas)}</td><td>${esc(r.aprendido || "")}</td></tr>`).join("")}</table></body></html>`;
    descargar("diario-practicas.doc", html, "application/msword");
  },
};
export function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
