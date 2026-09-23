// =============================================================
//  faltas.js — Faltas de asistencia por módulo (NOFC Digitech 6.1.1)
//   · Se cuenta por horas de clase (se pasa lista cada hora).
//   · Más del 15 % de faltas injustificadas → se pierde la evaluación continua.
//   · Hay que asistir al 80 % (máximo 20 % de faltas, justificadas o no).
//   · 3 retrasos (más de 10 min) en una materia = 1 falta injustificada.
// =============================================================
import { esc, nuevoId } from "./comun.js";
import { icono } from "./iconos.js";
import { horasDelCurso, clasesDeFecha, horasClase, aMin, iso } from "./curso.js";

const MARGEN = 10; // minutos de cortesía
export const TIPOS_FALTA = { injustificada: "Injustificada", justificada: "Justificada", retraso: "Retraso" };
const esModulo = (a) => a && !/tutor/i.test(a.nombre);
const fmtH = (h) => `${String(Math.round(h * 10) / 10).replace(".", ",")} h`;
const fechaBonita = (f) => new Date(f + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

// ---------- Cálculo por módulo ----------
export function calcularFaltas(d) {
  const horas = horasDelCurso(d);
  return d.asignaturas.filter((a) => esModulo(a) && horas[a.id]).map((a) => {
    const H = horas[a.id];
    const mias = d.faltas.filter((f) => f.asignatura === a.id);
    const inj = mias.filter((f) => f.tipo === "injustificada").reduce((s, f) => s + (Number(f.horas) || 0), 0);
    const jus = mias.filter((f) => f.tipo === "justificada").reduce((s, f) => s + (Number(f.horas) || 0), 0);
    const ret = mias.filter((f) => f.tipo === "retraso").length;
    const porRetrasos = Math.floor(ret / 3);
    const usadasFI = inj + porRetrasos;
    const usadasTot = inj + jus + porRetrasos;
    const limFI = Math.floor(H * 0.15);
    const limTot = Math.floor(H * 0.2);
    const ratio = Math.max(limFI ? usadasFI / limFI : 0, limTot ? usadasTot / limTot : 0);
    const estado = usadasFI > H * 0.15 || usadasTot > H * 0.2 ? "perdida" : ratio >= 0.8 ? "mal" : ratio >= 0.5 ? "aviso" : "ok";
    return { a, H, inj, jus, ret, porRetrasos, usadasFI, usadasTot, limFI, limTot, quedanFI: Math.max(0, limFI - usadasFI),
      quedanTot: Math.max(0, limTot - usadasTot), pctFI: (usadasFI / H) * 100, pctTot: (usadasTot / H) * 100, ratio, estado,
      retrasosParaFalta: 3 - (ret % 3) };
  });
}

// ---------- Propuestas a partir de los fichajes ----------
// Días con clase sin fichaje, llegadas tarde o salidas antes de tiempo
export function propuestas(d, fichajes) {
  if (!fichajes || !fichajes.length) return [];
  const porDia = new Map();
  for (const f of fichajes) {
    const k = iso(new Date(f.creado));
    if (!porDia.has(k)) porDia.set(k, []);
    porDia.get(k).push(f);
  }
  const primero = [...porDia.keys()].sort()[0];
  const ahora = new Date();
  const hoy = iso(ahora);
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const conFalta = new Set(d.faltas.map((f) => f.fecha));
  const cuenta = (c) => esModulo(d.asignaturas.find((a) => a.id === c.asignatura));
  const lista = [];
  const f = new Date(primero + "T00:00:00");
  for (; iso(f) <= hoy; f.setDate(f.getDate() + 1)) {
    const fecha = iso(f);
    if (d.faltasRevisadas.includes(fecha) || conFalta.has(fecha)) continue;
    const clases = clasesDeFecha(d, fecha).filter(cuenta);
    if (!clases.length) continue;
    if (fecha === hoy && minAhora < aMin(clases[clases.length - 1].fin)) continue; // hoy aún no ha acabado
    const del = (porDia.get(fecha) || []).sort((a, b) => a.creado.localeCompare(b.creado));
    const entrada = del.find((x) => x.accion === "entrada");
    const salida = [...del].reverse().find((x) => x.accion === "salida");
    if (!entrada) {
      lista.push({ fecha, tipo: "dia", texto: "No hay fichaje de entrada", items: clases.map((c) => ({ asignatura: c.asignatura, horas: horasClase(c), tipo: "falta" })) });
      continue;
    }
    const minE = new Date(entrada.creado).getHours() * 60 + new Date(entrada.creado).getMinutes();
    const items = [];
    for (const c of clases) {
      if (aMin(c.fin) <= minE) items.push({ asignatura: c.asignatura, horas: horasClase(c), tipo: "falta" });
      else if (minE > aMin(c.inicio) + MARGEN && !items.some((x) => x.tipo === "retraso")) items.push({ asignatura: c.asignatura, horas: 0, tipo: "retraso" });
    }
    if (salida) {
      const minS = new Date(salida.creado).getHours() * 60 + new Date(salida.creado).getMinutes();
      for (const c of clases) if (aMin(c.inicio) >= minS) items.push({ asignatura: c.asignatura, horas: horasClase(c), tipo: "falta" });
    }
    if (items.length) {
      const hora = new Date(entrada.creado).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      lista.push({ fecha, tipo: "parcial", texto: `Entrada a las ${hora}${salida ? `, salida a las ${new Date(salida.creado).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : ""}`, items });
    }
  }
  return lista.reverse();
}

// ---------- Vistas ----------
const nombreCorto = (a) => a.nombre.replace(/^\d{3,4}\s*/, "");
const ETQ = { ok: ["Bien", "ok"], aviso: ["Cuidado", "aviso"], mal: ["Al límite", "mal"], perdida: ["Límite superado", "mal"] };

export function htmlModulosFaltas(e, compacto = false) {
  const lista = calcularFaltas(e.datos);
  if (!lista.length) return `<p class="texto-suave">Añade tu horario para calcular las horas de cada módulo.</p>`;
  return `<div class="modulos-faltas ${compacto ? "compacto" : ""}">${lista.map((m) => `<div class="mf" style="--color:${esc(m.a.color)}">
      <div class="mf-cab"><b>${esc(nombreCorto(m.a))}</b><span class="chip ${ETQ[m.estado][1]}">${ETQ[m.estado][0]}</span></div>
      <div class="mf-barra"><i class="${ETQ[m.estado][1]}" style="width:${Math.min(100, Math.max(2, (m.usadasFI / Math.max(1, m.limFI)) * 100))}%"></i></div>
      <div class="mf-datos"><span>Injustificadas: <b>${fmtH(m.usadasFI)}</b> de ${fmtH(m.limFI)}</span><span class="mf-quedan">quedan ${fmtH(m.quedanFI)}</span></div>
      ${compacto ? "" : `<div class="mf-datos suave"><span>Total faltas: ${fmtH(m.usadasTot)} de ${fmtH(m.limTot)} (${m.pctTot.toFixed(1).replace(".", ",")} %)</span>
        <span>Retrasos: ${m.ret}${m.ret ? ` · al ${m.retrasosParaFalta === 3 ? "tercero" : m.retrasosParaFalta === 1 ? "siguiente" : "segundo"} cuenta como falta` : ""}</span></div>
        <small class="texto-suave">${fmtH(m.H)} de clase en el curso</small>`}
    </div>`).join("")}</div>`;
}

export function htmlPropuestas(e) {
  if (!e.editor) return "";
  const lista = propuestas(e.datos, e.fichajes).slice(0, 6);
  if (!lista.length) return "";
  const nom = (id) => nombreCorto(e.datos.asignaturas.find((a) => a.id === id) || { nombre: id });
  return `<section class="panel propuestas"><div class="panel-titulo"><h2>${icono("aviso")} Revisa estos días</h2></div>
    <p class="texto-suave">Según tus fichajes, podrías tener faltas o retrasos. Confírmalo para que cuenten en el porcentaje.</p>
    ${lista.map((p) => `<div class="propuesta">
      <div><b>${esc(fechaBonita(p.fecha))}</b><small>${esc(p.texto)}</small>
        <ul>${p.items.map((x) => `<li>${x.tipo === "retraso" ? "Retraso" : `Falta de ${fmtH(x.horas)}`} en ${esc(nom(x.asignatura))}</li>`).join("")}</ul></div>
      <div class="propuesta-botones">
        <button class="boton peque" type="button" data-accion="propuesta" data-fecha="${p.fecha}" data-como="injustificada">Apuntar</button>
        <button class="boton peque" type="button" data-accion="propuesta" data-fecha="${p.fecha}" data-como="justificada">Justificada</button>
        <button class="boton peque fantasma" type="button" data-accion="propuesta" data-fecha="${p.fecha}" data-como="no">${p.tipo === "dia" ? "Fui a clase" : "Ignorar"}</button>
      </div></div>`).join("")}
  </section>`;
}

export function htmlListaFaltas(e) {
  const d = e.datos;
  const porFecha = new Map();
  for (const f of [...d.faltas].sort((a, b) => b.fecha.localeCompare(a.fecha))) {
    if (!porFecha.has(f.fecha)) porFecha.set(f.fecha, []);
    porFecha.get(f.fecha).push(f);
  }
  const nom = (id) => nombreCorto(d.asignaturas.find((a) => a.id === id) || { nombre: id });
  const filas = [...porFecha.entries()].map(([fecha, fs]) => `<div class="dia-falta">
      <div class="df-cab"><b>${esc(fechaBonita(fecha))}</b>
        ${e.editor && fs.some((f) => f.tipo !== "retraso") ? `<button class="enlace-ver" type="button" data-accion="justificar-email" data-fecha="${fecha}">${icono("buzon")} Email de justificación</button>` : ""}</div>
      ${fs.map((f) => `<div class="df-fila"><span>${esc(nom(f.asignatura))}</span><span>${f.tipo === "retraso" ? "Retraso" : fmtH(f.horas)}</span>
        ${e.editor ? `<select data-cambio="falta-tipo" data-id="${esc(f.id)}" aria-label="Tipo">${Object.entries(TIPOS_FALTA).map(([k, v]) => `<option value="${k}" ${f.tipo === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <button class="boton icono peque" type="button" data-accion="falta-quitar" data-id="${esc(f.id)}" aria-label="Quitar">${icono("cerrar")}</button>`
          : `<span class="chip ${f.tipo === "justificada" ? "ok" : f.tipo === "retraso" ? "aviso" : "mal"}">${TIPOS_FALTA[f.tipo]}</span>`}</div>`).join("")}
    </div>`).join("");
  const form = e.editor ? `<form class="form-falta" data-form="falta-nueva">
      <input type="date" name="fecha" required aria-label="Fecha">
      <select name="asignatura" aria-label="Materia"><option value="">Todo el día</option>${d.asignaturas.filter(esModulo).map((a) => `<option value="${esc(a.id)}">${esc(nombreCorto(a))}</option>`).join("")}</select>
      <select name="tipo" aria-label="Tipo">${Object.entries(TIPOS_FALTA).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <button class="boton" type="submit">${icono("mas")} Apuntar</button>
    </form>` : "";
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("calendario")} Faltas y retrasos</h2></div>
    ${form}${filas || `<p class="texto-suave">${e.editor ? "No hay faltas apuntadas. Así da gusto." : "Sin faltas."}</p>`}</section>`;
}

// ---------- Email de justificación (NOFC: a los docentes con copia al tutor/a) ----------
function emailJustificacion(d, fecha) {
  const fs = d.faltas.filter((f) => f.fecha === fecha && f.tipo !== "retraso");
  const asigs = [...new Set(fs.map((f) => f.asignatura))].map((id) => d.asignaturas.find((a) => a.id === id)).filter(Boolean);
  const para = asigs.map((a) => a.email).filter(Boolean);
  const cc = d.config.tutorEmail || "";
  const nombre = d.config.nombreCompleto || d.config.nombre || "";
  const f = new Date(fecha + "T00:00:00").toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });
  const cuerpo = `Bon dia,

Us escric per justificar la meva absència del dia ${f} a les classes de:
${asigs.map((a) => `- ${a.nombre}`).join("\n")}

Motiu: [escriu aquí el motiu]

Adjunto el justificant.

Moltes gràcies,
${nombre}
${d.config.curso || ""} · ${d.config.centro || ""}`;
  const q = new URLSearchParams({ subject: `Justificació d'absència – ${nombre} – ${f}`, body: cuerpo });
  if (cc) q.set("cc", cc);
  return { url: `mailto:${para.join(",")}?${q.toString().replace(/\+/g, "%20")}`, faltanEmails: asigs.filter((a) => !a.email).map((a) => a.nombre) };
}

// ---------- Acciones ----------
export const acciones = {
  propuesta(b, api) {
    const d = api.datos();
    const p = propuestas(d, api.estado().fichajes).find((x) => x.fecha === b.dataset.fecha);
    if (!p) return;
    if (b.dataset.como !== "no") {
      for (const x of p.items) d.faltas.push({ id: nuevoId(), fecha: p.fecha, asignatura: x.asignatura, horas: x.horas,
        tipo: x.tipo === "retraso" ? "retraso" : b.dataset.como });
    }
    d.faltasRevisadas.push(p.fecha);
    api.cambiar();
    api.aviso(b.dataset.como === "no" ? "Anotado: ese día fuiste a clase." : "Faltas apuntadas.");
  },
  "falta-quitar"(b, api) {
    const d = api.datos();
    d.faltas = d.faltas.filter((f) => f.id !== b.dataset.id);
    api.cambiar();
  },
  "justificar-email"(b, api) {
    const { url, faltanEmails } = emailJustificacion(api.datos(), b.dataset.fecha);
    if (faltanEmails.length) api.aviso(`Falta el email del profe de: ${faltanEmails.join(", ")}. Ponlo en «Editar materia».`, 6000);
    location.href = url;
  },
};

export const formularios = {
  "falta-nueva"(form, api) {
    const d = api.datos();
    const f = new FormData(form);
    const fecha = f.get("fecha");
    const tipo = f.get("tipo");
    const clases = clasesDeFecha(d, fecha);
    if (!clases.length) return api.aviso("Ese día no hay clase según el horario y el calendario.");
    const elegidas = f.get("asignatura") ? clases.filter((c) => c.asignatura === f.get("asignatura")) : clases;
    if (!elegidas.length) return api.aviso("Esa materia no tiene clase ese día.");
    const porAsig = new Map();
    for (const c of elegidas) porAsig.set(c.asignatura, (porAsig.get(c.asignatura) || 0) + horasClase(c));
    for (const [asignatura, horas] of porAsig) {
      if (tipo === "retraso") d.faltas.push({ id: nuevoId(), fecha, asignatura, horas: 0, tipo });
      else d.faltas.push({ id: nuevoId(), fecha, asignatura, horas, tipo });
    }
    api.cambiar();
    api.aviso("Apuntado.");
  },
};

export const cambios = {
  "falta-tipo"(el, api) {
    const f = api.datos().faltas.find((x) => x.id === el.dataset.id);
    if (!f) return;
    if (el.value === "retraso") f.horas = 0;
    else if (f.tipo === "retraso") {
      const c = clasesDeFecha(api.datos(), f.fecha).filter((x) => x.asignatura === f.asignatura);
      f.horas = c.reduce((s, x) => s + horasClase(x), 0);
    }
    f.tipo = el.value;
    api.cambiar();
  },
};

// Días seguidos llegando a tiempo (para la racha)
export function racha(d, fichajes) {
  if (!fichajes?.length) return 0;
  const entradas = new Map();
  for (const f of fichajes) if (f.accion === "entrada") {
    const k = iso(new Date(f.creado));
    const m = new Date(f.creado).getHours() * 60 + new Date(f.creado).getMinutes();
    if (!entradas.has(k) || m < entradas.get(k)) entradas.set(k, m);
  }
  let n = 0;
  const dia = new Date();
  for (let i = 0; i < 400; i++, dia.setDate(dia.getDate() - 1)) {
    const k = iso(dia);
    const clases = clasesDeFecha(d, k);
    if (!clases.length) continue;
    const m = entradas.get(k);
    if (m === undefined) { if (i === 0) continue; break; } // hoy aún puede estar pendiente
    if (m > aMin(clases[0].inicio) + MARGEN) break;
    n++;
  }
  return n;
}
