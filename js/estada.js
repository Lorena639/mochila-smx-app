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
  const campo = (k, label, tipo = "text", ph = "") => e.editor
    ? `<div class="campo"><label for="es-${k}">${label}</label><input id="es-${k}" type="${tipo}" data-cambio="estada-campo" data-k="${k}" value="${esc(s[k] || "")}" placeholder="${esc(ph)}"></div>`
    : `<div class="campo"><label>${label}</label><b>${esc(s[k] || "—")}</b></div>`;
  return `<header class="cabecera-seccion"><div><h1>Estada a l'empresa</h1><p>Tu diario de prácticas: horas, tareas y datos de contacto.</p></div></header>
    <div class="kpis">
      <div class="panel kpi"><span class="kpi-num">${h(hechas)}<small> h</small></span><span class="kpi-que">hechas${objetivo ? ` de ${h(objetivo)} h` : ""}</span></div>
      <div class="panel kpi"><span class="kpi-num">${objetivo ? h(Math.max(0, objetivo - hechas)) : "—"}<small> h</small></span><span class="kpi-que">por hacer</span></div>
      <div class="panel kpi"><span class="kpi-num">${s.registros.length}</span><span class="kpi-que">días registrados</span></div>
    </div>
    ${objetivo ? `<div class="progreso"><i style="width:${pct}%"></i></div>` : ""}
    <div class="rejilla-2">
      ${!e.editor ? "" : `<section class="panel"><div class="panel-titulo"><h2>${icono("mas")} Registrar un día</h2></div>
        <form class="rejilla-form" data-form="estada-dia">
          <div class="campo"><label for="edF">Fecha</label><input id="edF" type="date" name="fecha" required value="${hoyIso()}"></div>
          <div class="campo"><label for="edH">Horas</label><input id="edH" name="horas" required inputmode="decimal" placeholder="p. ej. 6"></div>
          <div class="campo ancho"><label for="edT">Qué he hecho</label><textarea id="edT" name="tareas" rows="4" required placeholder="p. ej. Instalación de 5 equipos, configuración de impresoras en red…"></textarea></div>
          <div class="campo ancho"><label for="edA">Qué he aprendido (opcional)</label><input id="edA" name="aprendido"></div>
          <div class="fila-botones"><button class="boton principal" type="submit">Guardar día</button></div>
        </form></section>`}
      <section class="panel"><div class="panel-titulo"><h2>${icono("maletin")} Datos de las prácticas</h2></div>
        <div class="rejilla-form">${campo("empresa", "Empresa")}${campo("direccion", "Dirección")}${campo("tutorEmpresa", "Tutor/a en la empresa")}${campo("tutorCentro", "Tutor/a del centro")}
          ${campo("horasObjetivo", "Horas necesarias", "text", "p. ej. 150")}${campo("horario", "Horario", "text", "p. ej. L-V 9:00-14:00")}${campo("inicio", "Inicio", "date")}${campo("fin", "Fin", "date")}</div>
      </section>
    </div>
    <section class="panel"><div class="panel-titulo"><h2>${icono("calendario")} Diario</h2>
      ${regs.length && e.editor ? `<span class="fila-botones"><button class="enlace-ver" type="button" data-accion="estada-informe">${icono("archivo")} Informe semanal (imprimir / PDF)</button>
        <button class="enlace-ver" type="button" data-accion="estada-exportar">${icono("descargar")} Word</button></span>` : ""}</div>
      ${regs.length ? `<div class="diario-estada">${regs.map((r) => `<article class="de-dia"><header><b>${new Date(r.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</b>
          <span class="chip">${h(n(r.horas))} h</span>${e.editor ? `<button class="boton icono peque" type="button" data-accion="estada-quitar" data-id="${esc(r.id)}" aria-label="Quitar">${icono("cerrar")}</button>` : ""}</header>
          <p>${esc(r.tareas).replace(/\n/g, "<br>")}</p>${r.aprendido ? `<p class="texto-suave">Aprendido: ${esc(r.aprendido)}</p>` : ""}</article>`).join("")}</div>`
        : `<p class="texto-suave">${e.editor ? "Cuando empieces las prácticas, apunta aquí cada día. Te servirá para la memoria final." : "Todavía no hay días registrados."}</p>`}
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
  // Informe para el tutor: una tabla por semana (lunes a domingo), con total de horas y firmas
  "estada-informe"(b, api) {
    const d = api.datos();
    const s = d.estada;
    const regs = [...s.registros].sort((a, b2) => a.fecha.localeCompare(b2.fecha));
    const lunesDe = (f) => { const x = new Date(f + "T00:00:00"); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x; };
    const semanas = new Map();
    for (const r of regs) { const k = lunesDe(r.fecha).toISOString().slice(0, 10); if (!semanas.has(k)) semanas.set(k, []); semanas.get(k).push(r); }
    const fl = (f) => new Date(f + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    const fc = (x) => x.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    let total = 0, nSem = 0;
    const cuerpo = [...semanas.entries()].map(([k, rs]) => {
      nSem++;
      const l = new Date(k + "T00:00:00"); const dm = new Date(l); dm.setDate(dm.getDate() + 6);
      const hs = rs.reduce((a, r) => a + n(r.horas), 0); total += hs;
      return `<section class="semana"><h2>Semana ${nSem} · del ${fc(l)} al ${fc(dm)}</h2>
        <table><thead><tr><th style="width:22%">Día</th><th style="width:8%">Horas</th><th>Tareas realizadas</th><th style="width:25%">Aprendizajes</th></tr></thead><tbody>
        ${rs.map((r) => `<tr><td>${esc(fl(r.fecha))}</td><td class="c">${h(n(r.horas))}</td><td>${esc(r.tareas).replace(/\n/g, "<br>")}</td><td>${esc(r.aprendido || "")}</td></tr>`).join("")}
        <tr class="tot"><td>Total semana</td><td class="c">${h(hs)} h</td><td colspan="2">Acumulado: ${h(total)} h${n(s.horasObjetivo) ? ` de ${h(n(s.horasObjetivo))} h` : ""}</td></tr></tbody></table>
        <div class="firmas"><div>Firma alumna</div><div>Firma tutor/a empresa</div><div>Firma tutor/a centro</div></div></section>`;
    }).join("");
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de prácticas · ${esc(d.config.nombreCompleto || d.config.nombre || "")}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:12px}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px}
      .datos{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin:10px 0 6px;padding:10px;border:1px solid #bbb;border-radius:6px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}th{background:#eef2f7}.c{text-align:center}
      .tot td{background:#f6f6f6;font-weight:bold}.firmas{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
      .firmas div{border-top:1px solid #333;padding-top:4px;margin-top:38px;text-align:center;color:#444}.semana{page-break-inside:avoid;page-break-after:always}
      .semana:last-child{page-break-after:auto}.boton{position:fixed;top:12px;right:12px;padding:8px 14px;font-size:14px}@media print{.boton{display:none}body{margin:10mm}}</style></head>
      <body><button class="boton" onclick="print()">Imprimir / Guardar PDF</button>
      <h1>Informe de la Estada a l'empresa (FCT)</h1>
      <div class="datos"><div><b>Alumna:</b> ${esc(d.config.nombreCompleto || d.config.nombre || "")}</div><div><b>Ciclo:</b> ${esc(d.config.curso || "SMX")}</div>
        <div><b>Empresa:</b> ${esc(s.empresa)}</div><div><b>Dirección:</b> ${esc(s.direccion)}</div>
        <div><b>Tutor/a empresa:</b> ${esc(s.tutorEmpresa)}</div><div><b>Tutor/a centro:</b> ${esc(s.tutorCentro)}</div>
        <div><b>Horario:</b> ${esc(s.horario)}</div><div><b>Horas hechas:</b> ${h(total)}${n(s.horasObjetivo) ? ` de ${h(n(s.horasObjetivo))}` : ""}</div></div>
      ${cuerpo}</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { descargar("informe-practicas.html", html, "text/html"); api.aviso("Descargado. Ábrelo y pulsa Imprimir para sacar el PDF."); return; }
    w.document.write(html); w.document.close();
  },
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
