// =============================================================
//  estudio.js — Herramientas para estudiar (solo en modo edición)
//   · Tarjetas de repaso con repetición espaciada (sistema Leitner)
//   · Temporizador de estudio (Pomodoro) con registro de horas
//   · Modo examen: cuenta atrás, temas, lista de repaso y lo que necesitas
//   · Asistente: responde preguntas con tus propios datos (sin IA)
// =============================================================
import { esc, nuevoId, hoyIso, normalizar, diasHasta, notificar } from "./comun.js";
import { icono } from "./iconos.js";
import { clasesDeFecha, iso } from "./curso.js";
import { calcularFaltas } from "./faltas.js";
import { calcularModulo, f1 } from "./notas.js";

const INTERVALOS = [1, 2, 4, 8, 16]; // días hasta volver a ver la tarjeta, según su caja
const sumarDias = (f, n) => { const x = new Date(f + "T00:00:00"); x.setDate(x.getDate() + n); return iso(x); };
const nombreCorto = (a) => (a?.nombre || "").replace(/^\d{3,4}\s*/, "");
const asig = (d, id) => d.asignaturas.find((a) => a.id === id);
const opcionesAsig = (d, sel = "", vacio = "Todas") => `<option value="">${vacio}</option>${d.asignaturas.map((a) => `<option value="${esc(a.id)}" ${sel === a.id ? "selected" : ""}>${esc(nombreCorto(a))}</option>`).join("")}`;

// =============================================================
//  TARJETAS
// =============================================================
export const pendientes = (d, asignatura = "") => d.tarjetas.filter((t) => (t.proxima || "") <= hoyIso() && (!asignatura || t.asignatura === asignatura));

function htmlTarjetas(e) {
  const d = e.datos;
  const filtro = e.filtros.asignatura || "";
  const r = e.repaso;
  if (r) {
    const t = d.tarjetas.find((x) => x.id === r.cola[r.i]);
    if (!t) {
      return `<section class="panel repaso-fin"><h2>Repaso terminado</h2>
        <p><b>${r.bien}</b> bien · <b>${r.mal}</b> para repasar otra vez</p>
        <button class="boton principal" type="button" data-accion="repaso-salir">Volver</button></section>`;
    }
    return `<section class="panel tarjeta-repaso">
      <div class="tr-cab"><span class="chip">${esc(nombreCorto(asig(d, t.asignatura)) || "General")}</span><small class="texto-suave">${r.i + 1} de ${r.cola.length}</small></div>
      <p class="tr-pregunta">${esc(t.pregunta)}</p>
      ${r.mostrar ? `<div class="tr-respuesta">${esc(t.respuesta).replace(/\n/g, "<br>")}</div>
        <div class="fila-botones centro"><button class="boton" type="button" data-accion="repaso-mal">No la sabía</button>
          <button class="boton principal" type="button" data-accion="repaso-bien">La sabía</button></div>`
        : `<div class="fila-botones centro"><button class="boton principal" type="button" data-accion="repaso-mostrar">Ver respuesta</button></div>`}
      <button class="enlace-ver" type="button" data-accion="repaso-salir">Terminar</button>
    </section>`;
  }
  const hoy = pendientes(d, filtro);
  const lista = d.tarjetas.filter((t) => !filtro || t.asignatura === filtro);
  const porCaja = [1, 2, 3, 4, 5].map((c) => lista.filter((t) => (t.caja || 1) === c).length);
  const ed = e.editor;
  return `<div class="kpis">
      <div class="panel kpi"><span class="kpi-num">${hoy.length}</span><span class="kpi-que">Para repasar hoy</span></div>
      <div class="panel kpi"><span class="kpi-num">${lista.length}</span><span class="kpi-que">Tarjetas</span></div>
      <div class="panel kpi"><span class="kpi-num">${porCaja[3] + porCaja[4]}</span><span class="kpi-que">Casi dominadas</span></div>
    </div>
    <div class="filtros"><select data-cambio="filtro-asig" aria-label="Materia">${opcionesAsig(d, filtro)}</select>
      ${ed ? `<button class="boton principal" type="button" data-accion="repaso-empezar" ${hoy.length ? "" : "disabled"}>${icono("play")} Repasar ${hoy.length ? `(${hoy.length})` : ""}</button>` : ""}</div>
    ${ed ? `<section class="panel"><div class="panel-titulo"><h2>${icono("mas")} Nueva tarjeta</h2></div>
      <form class="rejilla-form" data-form="tarjeta-nueva">
        <div class="campo"><label for="tjAsig">Materia</label><select id="tjAsig" name="asignatura">${opcionesAsig(d, filtro, "General")}</select></div>
        <div class="campo ancho"><label for="tjP">Pregunta</label><input id="tjP" name="pregunta" required placeholder="p. ej. ¿Qué puerto usa DNS?"></div>
        <div class="campo ancho"><label for="tjR">Respuesta</label><textarea id="tjR" name="respuesta" required rows="2" placeholder="p. ej. 53 (UDP y TCP)"></textarea></div>
        <div class="fila-botones"><button class="boton principal" type="submit">Añadir tarjeta</button></div>
      </form></section>` : ""}
    <section class="panel"><div class="panel-titulo"><h2>${icono("tarjetas")} Mis tarjetas</h2><small class="texto-suave">Las que aciertas tardan más en volver a salir</small></div>
      <div class="cajas">${porCaja.map((n, i) => `<div><b>${n}</b><small>Caja ${i + 1} · cada ${INTERVALOS[i]} ${INTERVALOS[i] === 1 ? "día" : "días"}</small></div>`).join("")}</div>
      ${lista.length ? `<ul class="lista-tarjetas">${lista.map((t) => `<li><span><b>${esc(t.pregunta)}</b><small>${esc(t.respuesta)}</small></span>
        <span class="chip">Caja ${t.caja || 1}</span>
        ${ed ? `<button class="boton icono peque" type="button" data-accion="tarjeta-quitar" data-id="${esc(t.id)}" aria-label="Borrar">${icono("borrar")}</button>` : ""}</li>`).join("")}</ul>`
        : `<p class="texto-suave">Crea tarjetas con lo que tengas que memorizar: puertos, comandos, conceptos…</p>`}
    </section>`;
}

// =============================================================
//  TEMPORIZADOR (sigue contando aunque cambies de sección)
// =============================================================
const T = { modo: "trabajo", trabajo: 25, descanso: 5, restante: 25 * 60, fin: null, asignatura: "", intervalo: null, api: null };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const temporizadorActivo = () => Boolean(T.fin);
export const textoTemporizador = () => `${T.modo === "trabajo" ? "Estudio" : "Descanso"} ${mmss(T.fin ? Math.max(0, (T.fin - Date.now()) / 1000) : T.restante)}`;

function tic() {
  if (!T.fin) return;
  const quedan = Math.max(0, (T.fin - Date.now()) / 1000);
  document.querySelectorAll("[data-reloj]").forEach((el) => (el.textContent = mmss(quedan)));
  document.querySelectorAll("[data-reloj-mini]").forEach((el) => (el.textContent = textoTemporizador()));
  const total = (T.modo === "trabajo" ? T.trabajo : T.descanso) * 60;
  document.querySelectorAll("[data-reloj-anillo]").forEach((el) => el.setAttribute("stroke-dashoffset", String(565.5 * (quedan / total))));
  if (quedan <= 0) terminarBloque();
}
function terminarBloque() {
  clearInterval(T.intervalo); T.intervalo = null; T.fin = null;
  const api = T.api;
  if (T.modo === "trabajo") {
    api?.datos().estudio.push({ id: nuevoId(), fecha: hoyIso(), asignatura: T.asignatura, minutos: T.trabajo });
    avisarSistema("Bloque de estudio terminado", `Llevas ${T.trabajo} minutos. Toca descansar ${T.descanso}.`);
    T.modo = "descanso"; T.restante = T.descanso * 60;
    api?.cambiar();
  } else {
    avisarSistema("Descanso terminado", "¿Otro bloque de estudio?");
    T.modo = "trabajo"; T.restante = T.trabajo * 60;
    api?.pintar();
  }
}
function avisarSistema(titulo, cuerpo) {
  notificar(titulo, { body: cuerpo });
  T.api?.aviso(`${titulo}. ${cuerpo}`, 5000);
}

function htmlTemporizador(e) {
  const d = e.datos;
  const total = (T.modo === "trabajo" ? T.trabajo : T.descanso) * 60;
  const quedan = T.fin ? Math.max(0, (T.fin - Date.now()) / 1000) : T.restante;
  // Estadísticas: últimos 7 días y por materia esta semana
  const dias = [...Array(7)].map((_, i) => sumarDias(hoyIso(), i - 6));
  const minDia = dias.map((f) => d.estudio.filter((s) => s.fecha === f).reduce((a, s) => a + s.minutos, 0));
  const maxDia = Math.max(60, ...minDia);
  const semana = d.estudio.filter((s) => s.fecha >= dias[0]);
  const porAsig = new Map();
  for (const s of semana) porAsig.set(s.asignatura, (porAsig.get(s.asignatura) || 0) + s.minutos);
  const maxAsig = Math.max(1, ...porAsig.values());
  const totalH = d.estudio.reduce((a, s) => a + s.minutos, 0) / 60;
  const reloj = !e.editor ? "" : `
    <section class="panel temporizador ${T.modo}">
      <div class="reloj"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90" class="r-fondo"/>
        <circle cx="100" cy="100" r="90" class="r-valor" data-reloj-anillo stroke-dasharray="565.5" stroke-dashoffset="${565.5 * (quedan / total)}"/></svg>
        <div class="reloj-txt"><b data-reloj>${mmss(quedan)}</b><small>${T.modo === "trabajo" ? "Estudio" : "Descanso"}</small></div></div>
      <div class="fila-botones centro">
        ${T.fin ? `<button class="boton" type="button" data-accion="temp-pausa">${icono("pausa")} Pausa</button>`
          : `<button class="boton principal" type="button" data-accion="temp-empezar">${icono("play")} ${quedan < total ? "Seguir" : "Empezar"}</button>`}
        <button class="boton" type="button" data-accion="temp-reiniciar">${icono("reiniciar")} Reiniciar</button>
      </div>
      <div class="rejilla-form">
        <div class="campo"><label for="tpAsig">Estoy estudiando</label><select id="tpAsig" data-cambio="temp-asig">${opcionesAsig(d, T.asignatura, "Sin materia")}</select></div>
        <div class="campo"><label for="tpModo">Bloques</label><select id="tpModo" data-cambio="temp-modo">
          ${[[25, 5], [50, 10], [15, 3]].map(([a, b]) => `<option value="${a}-${b}" ${T.trabajo === a ? "selected" : ""}>${a} min + ${b} de descanso</option>`).join("")}</select></div>
      </div>
      ${"Notification" in window && Notification.permission === "default" ? `<button class="enlace-ver" type="button" data-accion="avisos-permiso">Avisarme con una notificación al terminar</button>` : ""}
    </section>`;
  return `<div class="temporizador-zona ${e.editor ? "" : "solo-estadisticas"}">${reloj}
    <section class="panel"><div class="panel-titulo"><h2>${icono("grafico")} Horas de estudio · últimos 7 días</h2><small class="texto-suave">${f1(totalH)} h en total</small></div>
      <div class="barras-dias">${dias.map((f, i) => `<div><span class="bd-barra"><i style="height:${(minDia[i] / maxDia) * 100}%"></i></span>
        <small>${new Date(f + "T00:00:00").toLocaleDateString("es-ES", { weekday: "narrow" })}</small><b>${minDia[i] ? `${Math.round(minDia[i])}′` : ""}</b></div>`).join("")}</div>
      <h3 class="subt">Esta semana por materia</h3>
      ${porAsig.size ? `<div class="barras-h">${[...porAsig.entries()].sort((a, b) => b[1] - a[1]).map(([id, m]) => `<div><span>${esc(nombreCorto(asig(d, id)) || "Sin materia")}</span>
        <span class="bh-barra"><i style="width:${(m / maxAsig) * 100}%;background:${esc(asig(d, id)?.color || "var(--acento)")}"></i></span><b>${f1(m / 60)} h</b></div>`).join("")}</div>`
        : `<p class="texto-suave">Aún no has estudiado esta semana con el temporizador.</p>`}
    </section></div>`;
}

// =============================================================
//  EXÁMENES y MODO EXAMEN
// =============================================================
export const examenes = (d) => d.eventos.filter((ev) => ev.tipo === "Examen" && (ev.fechaFin || ev.fecha) >= hoyIso())
  .sort((a, b) => a.fecha.localeCompare(b.fecha));

function htmlExamenes(e) {
  const d = e.datos;
  const lista = examenes(d);
  return `${e.editor ? `<div class="barra-acciones"><button class="boton principal" type="button" data-nuevo="eventos" data-preset="tipo=Examen">${icono("mas")} Añadir examen</button></div>` : ""}
    ${lista.length ? `<div class="lista-examenes">${lista.map((ev) => {
      const k = diasHasta(ev.fecha);
      const a = asig(d, ev.asignatura);
      return `<button type="button" class="panel examen-item" data-ir="estudio/examen/${esc(ev.id)}" style="--color:${esc(a?.color || "var(--acento)")}">
        <span class="ex-dias"><b>${k <= 0 ? "Hoy" : k}</b><small>${k <= 0 ? "" : k === 1 ? "día" : "días"}</small></span>
        <span><b>${esc(ev.titulo)}</b><small class="texto-suave">${esc(nombreCorto(a) || "")} · ${new Date(ev.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</small></span>
        ${icono("flecha")}</button>`;
    }).join("")}</div>` : `<div class="vacio">No hay exámenes a la vista. Añádelos en el calendario con tipo «Examen».</div>`}`;
}

export function vistaExamen(e, id) {
  const d = e.datos;
  const ev = d.eventos.find((x) => x.id === id);
  if (!ev) return `<div class="vacio">Este examen no existe.</div>`;
  const a = asig(d, ev.asignatura);
  const ms = new Date(ev.fecha + "T08:00:00") - Date.now();
  const diasQ = Math.max(0, Math.floor(ms / 86400000));
  const horasQ = Math.max(0, Math.floor((ms % 86400000) / 3600000));
  const check = ev.checklist || [];
  const hechos = check.filter((c) => c.hecho).length;
  const m = d.notas?.[ev.asignatura] ? calcularModulo(d.notas[ev.asignatura]) : null;
  const necesito = m ? m.ras.filter(({ r }) => r.necesito && r.necesito.parte === "pruebas") : [];
  const tarjetasAsig = pendientes(d, ev.asignatura).length;
  const apuntes = d.apuntes.filter((x) => x.asignatura === ev.asignatura).slice(0, 6);
  return `<button type="button" class="volver" data-ir="estudio/examenes">${icono("flecha-izq")} Exámenes</button>
    <header class="examen-cab" style="--color:${esc(a?.color || "var(--acento)")}">
      <div><span class="chip">${esc(nombreCorto(a) || "Examen")}</span><h1>${esc(ev.titulo)}</h1>
        <p>${new Date(ev.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p></div>
      <div class="cuenta-atras"><div><b>${diasQ}</b><small>días</small></div><div><b>${horasQ}</b><small>horas</small></div></div>
    </header>
    <div class="rejilla-2">
      <section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Qué entra</h2></div>
        ${e.editor ? `<textarea class="temas" data-cambio="examen-temas" data-id="${esc(id)}" rows="6" placeholder="Escribe los temas o RA que entran…">${esc(ev.temas || "")}</textarea>`
          : `<p class="texto">${ev.temas ? esc(ev.temas).replace(/\n/g, "<br>") : `<span class="texto-suave">Sin temas apuntados.</span>`}</p>`}
        <h3 class="subt">Plan de repaso <small class="texto-suave">${hechos}/${check.length}</small></h3>
        <ul class="checklist">${check.map((c, i) => `<li><label><input type="checkbox" data-cambio="examen-check" data-id="${esc(id)}" data-i="${i}" ${c.hecho ? "checked" : ""} ${e.editor ? "" : "disabled"}> <span>${esc(c.texto)}</span></label>
          ${e.editor ? `<button class="boton icono peque" type="button" data-accion="examen-check-quitar" data-id="${esc(id)}" data-i="${i}" aria-label="Quitar">${icono("cerrar")}</button>` : ""}</li>`).join("")}</ul>
        ${e.editor ? `<form class="form-inline" data-form="examen-check"><input type="hidden" name="id" value="${esc(id)}"><input name="texto" required placeholder="p. ej. Repasar RA2: copias de seguridad"><button class="boton" type="submit">${icono("mas")}</button></form>` : ""}
      </section>
      <div class="columna">
        ${necesito.length ? `<section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Lo que necesitas</h2></div>
          ${necesito.map(({ ra, r }) => `<p><b>${esc(ra.id)}</b>: para aprobar, <b>${r.necesito.para5 > 10 ? "más de 10" : f1(r.necesito.para5)}</b> en la prueba${r.necesito.para7 <= 10 ? ` · para un 7: <b>${f1(r.necesito.para7)}</b>` : ""}</p>`).join("")}</section>` : ""}
        ${!e.editor ? "" : `<section class="panel"><div class="panel-titulo"><h2>${icono("tarjetas")} Repaso</h2></div>
          <p>${tarjetasAsig ? `Tienes <b>${tarjetasAsig}</b> tarjetas de esta materia para hoy.` : "No tienes tarjetas pendientes de esta materia."}</p>
          <div class="fila-botones"><button class="boton principal" type="button" data-accion="repaso-empezar" data-asig="${esc(ev.asignatura)}" ${tarjetasAsig ? "" : "disabled"}>Repasar tarjetas</button>
            <button class="boton" type="button" data-accion="temp-materia" data-asig="${esc(ev.asignatura)}">${icono("reloj")} Estudiar 25 min</button></div></section>`}
        ${apuntes.length ? `<section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Apuntes</h2></div>
          <ul class="lista-simple">${apuntes.map((x) => `<li><button class="enlace-ver" type="button" data-ir="materia/${esc(ev.asignatura)}/apuntes">${esc(x.titulo)}</button></li>`).join("")}</ul></section>` : ""}
      </div>
    </div>`;
}

// =============================================================
//  Página "Estudiar"
// =============================================================
export function vistaEstudio(e, pestana = "tarjetas") {
  const tab = (id, t, ic) => `<button type="button" class="segmento" aria-pressed="${pestana === id}" data-ir="estudio/${id}">${icono(ic)}${t}</button>`;
  const cuerpo = pestana === "temporizador" ? htmlTemporizador(e) : pestana === "examenes" ? htmlExamenes(e) : htmlTarjetas(e);
  return `<header class="cabecera-seccion"><div><h1>Estudiar</h1><p>${e.editor ? "Tarjetas de repaso, temporizador y preparación de exámenes." : `Cómo estudia ${esc(e.datos.config.nombre || "Lorena")}: tarjetas, horas de estudio y exámenes.`}</p></div></header>
    <div class="segmentos">${tab("tarjetas", "Tarjetas", "tarjetas")}${tab("temporizador", e.editor ? "Temporizador" : "Horas de estudio", "reloj")}${tab("examenes", "Exámenes", "bandera")}
      <button type="button" class="segmento" data-ir="python">${icono("terminal")}Python</button></div>
    ${cuerpo}`;
}

// =============================================================
//  "MAÑANA" y ASISTENTE
// =============================================================
export function siguienteDiaClase(d, desde = hoyIso()) {
  for (let i = 1; i < 30; i++) {
    const f = sumarDias(desde, i);
    const clases = clasesDeFecha(d, f);
    if (clases.length) return { fecha: f, clases };
  }
  return null;
}

export function htmlManana(e, desde = hoyIso()) {
  const d = e.datos;
  const sig = siguienteDiaClase(d, desde);
  if (!sig) return `<p class="texto-suave">No hay clase en los próximos días.</p>`;
  const cosas = d.eventos.filter((ev) => ev.fecha <= sig.fecha && (ev.fechaFin || ev.fecha) >= sig.fecha && !["Festivo", "Vacaciones", "Sin clase"].includes(ev.tipo));
  const entregas = d.trabajos.filter((t) => t.fecha === sig.fecha && t.estado === "curso");
  const tablon = d.avisos.filter((a) => a.fecha && a.fecha >= sumarDias(desde, -3)).slice(0, 3);
  const cuando = diasHasta(sig.fecha) === 1 ? "Mañana" : new Date(sig.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long" });
  return `<p class="manana-tit"><b>${esc(cuando.charAt(0).toUpperCase() + cuando.slice(1))}</b>: ${sig.clases.length} ${sig.clases.length === 1 ? "clase" : "clases"}, de ${sig.clases[0].inicio} a ${sig.clases[sig.clases.length - 1].fin}</p>
    <ul class="lista-simple">${sig.clases.map((c) => `<li><span class="punto" style="background:${esc(asig(d, c.asignatura)?.color || "var(--acento)")}"></span>${esc(c.inicio)} ${esc(nombreCorto(asig(d, c.asignatura)))}</li>`).join("")}</ul>
    ${cosas.length || entregas.length ? `<p class="manana-importante">${[...cosas.map((x) => `${x.tipo}: ${x.titulo}`), ...entregas.map((t) => `Entrega: ${t.titulo}`)].map(esc).join("<br>")}</p>` : ""}
    ${tablon.length ? `<p class="texto-suave">Del tablón: ${tablon.map((a) => esc(a.texto.slice(0, 80))).join(" · ")}</p>` : ""}`;
}

const DIAS_N = ["lunes", "martes", "miercoles", "jueves", "viernes"];
function buscarMateria(d, q) {
  return d.asignaturas.find((a) => {
    const cod = (a.nombre.match(/^\d{3,4}/) || [""])[0];
    if (cod && q.includes(cod)) return true;
    return normalizar(nombreCorto(a)).split(/\s+/).filter((w) => w.length > 4).some((w) => q.includes(w));
  });
}

// Devuelve HTML con la respuesta, o "" si no entiende la pregunta
export function responder(e, pregunta) {
  const d = e.datos;
  const q = normalizar(pregunta);
  if (q.length < 3) return "";
  const m = buscarMateria(d, q);
  if (/manana|pasado/.test(q)) return htmlManana(e);
  if (/\bhoy\b/.test(q)) {
    const clases = clasesDeFecha(d, hoyIso());
    return clases.length ? `<p>Hoy tienes ${clases.map((c) => `<b>${esc(nombreCorto(asig(d, c.asignatura)))}</b> a las ${c.inicio}`).join(", ")}.</p>` : `<p>Hoy no tienes clase.</p>`;
  }
  const dia = DIAS_N.findIndex((x) => q.includes(x));
  if (dia >= 0 && /clase|horario|tengo|que hay/.test(q)) {
    const clases = d.horario.filter((c) => c.dia === dia + 1).sort((a, b) => a.inicio.localeCompare(b.inicio));
    return `<p>Los ${DIAS_N[dia].replace("miercoles", "miércoles")}: ${clases.map((c) => `<b>${esc(nombreCorto(asig(d, c.asignatura)))}</b> ${c.inicio}–${c.fin}`).join(", ") || "sin clase"}.</p>`;
  }
  if (/falta|asistencia|faltar|margen|retras/.test(q)) {
    const lista = calcularFaltas(d).filter((x) => !m || x.a.id === m.id);
    if (!lista.length) return `<p>No tengo datos de faltas.</p>`;
    return `<p>${lista.map((x) => `<b>${esc(nombreCorto(x.a))}</b>: te quedan ${String(x.quedanFI).replace(".", ",")} h de faltas injustificadas`).join("<br>")}</p>`;
  }
  if (/nota|aprob|necesit|media/.test(q)) {
    const ids = m ? [m.id] : Object.keys(d.notas || {});
    const partes = ids.filter((id) => d.notas?.[id]).map((id) => {
      const c = calcularModulo(d.notas[id]);
      const nec = c.ras.find(({ r }) => r.necesito);
      return `<b>${esc(nombreCorto(asig(d, id)) || id)}</b>: ${c.nota === null ? "sin notas aún" : `${c.completo ? "nota final" : "provisional"} ${f1(c.final ?? c.nota)}`}${nec ? ` · para aprobar ${nec.ra.id} necesitas ${f1(nec.r.necesito.para5)} en ${nec.r.necesito.parte}` : ""}`;
    });
    return partes.length ? `<p>${partes.join("<br>")}</p>` : `<p>Aún no hay notas apuntadas.</p>`;
  }
  if (/examen|examenes/.test(q)) {
    const ex = examenes(d).filter((x) => !m || x.asignatura === m.id).slice(0, 4);
    return ex.length ? `<p>${ex.map((x) => `<b>${esc(x.titulo)}</b>: ${diasHasta(x.fecha) <= 0 ? "hoy" : `en ${diasHasta(x.fecha)} días`}`).join("<br>")}</p>` : `<p>No hay exámenes a la vista.</p>`;
  }
  if (/entrega|trabajo|pendiente|semana/.test(q)) {
    const lim = sumarDias(hoyIso(), 7);
    const ev = d.eventos.filter((x) => ["Entrega", "Examen"].includes(x.tipo) && x.fecha >= hoyIso() && x.fecha <= lim);
    const tr = d.trabajos.filter((t) => t.estado === "curso" && t.fecha && t.fecha >= hoyIso() && t.fecha <= lim);
    const todo = [...ev.map((x) => [x.fecha, `${x.tipo}: ${x.titulo}`]), ...tr.map((t) => [t.fecha, `Entrega: ${t.titulo}`])].sort();
    return todo.length ? `<p>En los próximos 7 días:<br>${todo.map(([f, t]) => `${new Date(f + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })} · ${esc(t)}`).join("<br>")}</p>` : `<p>Nada pendiente en los próximos 7 días.</p>`;
  }
  if (/tarjeta|repas/.test(q)) {
    const n = pendientes(d, m?.id).length;
    return `<p>Tienes <b>${n}</b> tarjetas para repasar hoy${m ? ` de ${esc(nombreCorto(m))}` : ""}.</p>`;
  }
  if (/python/.test(q)) {
    const ex = d.eventos.find((x) => x.id === "of-pendents");
    const t = d.python?.temario || [];
    return `<p>${ex ? `El examen de pendientes es en <b>${diasHasta(ex.fecha)} días</b>. ` : ""}${t.length ? `Llevas ${t.filter((x) => x.hecho).length} de ${t.length} temas.` : ""}</p>`;
  }
  return "";
}
export const SUGERENCIAS = ["¿Qué tengo mañana?", "¿Cuántas faltas me quedan?", "¿Qué necesito para aprobar?", "Entregas de esta semana", "Próximos exámenes"];

// =============================================================
//  Acciones
// =============================================================
export const acciones = {
  "repaso-empezar"(b, api) {
    const d = api.datos();
    const cola = pendientes(d, b.dataset.asig || api.estado().filtros.asignatura || "").map((t) => t.id).sort(() => Math.random() - 0.5);
    if (!cola.length) return api.aviso("No hay tarjetas pendientes.");
    api.estado().repaso = { cola, i: 0, mostrar: false, bien: 0, mal: 0 };
    if (!location.hash.startsWith("#estudio/tarjetas")) location.hash = "#estudio/tarjetas"; else api.pintar();
  },
  "repaso-mostrar"(b, api) { api.estado().repaso.mostrar = true; api.pintar(); },
  "repaso-bien"(b, api) { responderTarjeta(api, true); },
  "repaso-mal"(b, api) { responderTarjeta(api, false); },
  "repaso-salir"(b, api) { api.estado().repaso = null; api.pintar(); },
  "tarjeta-quitar"(b, api) { const d = api.datos(); d.tarjetas = d.tarjetas.filter((t) => t.id !== b.dataset.id); api.cambiar(); },
  "temp-empezar"(b, api) {
    T.api = api;
    T.fin = Date.now() + T.restante * 1000;
    clearInterval(T.intervalo); T.intervalo = setInterval(tic, 500);
    api.pintar();
  },
  "temp-pausa"(b, api) { T.restante = Math.max(0, (T.fin - Date.now()) / 1000); T.fin = null; clearInterval(T.intervalo); api.pintar(); },
  "temp-reiniciar"(b, api) { T.fin = null; clearInterval(T.intervalo); T.modo = "trabajo"; T.restante = T.trabajo * 60; api.pintar(); },
  "temp-materia"(b, api) { T.asignatura = b.dataset.asig || ""; location.hash = "#estudio/temporizador"; },
  async "avisos-permiso"(b, api) { try { await Notification.requestPermission(); } catch {} api.pintar(); },
  "examen-check-quitar"(b, api) { const ev = api.datos().eventos.find((x) => x.id === b.dataset.id); ev.checklist.splice(Number(b.dataset.i), 1); api.cambiar(); },
};
function responderTarjeta(api, bien) {
  const e = api.estado();
  const d = api.datos();
  const r = e.repaso;
  const t = d.tarjetas.find((x) => x.id === r.cola[r.i]);
  t.caja = bien ? Math.min(5, (t.caja || 1) + 1) : 1;
  t.proxima = sumarDias(hoyIso(), bien ? INTERVALOS[t.caja - 1] : 0);
  if (bien) r.bien++; else { r.mal++; r.cola.push(t.id); }
  r.i++; r.mostrar = false;
  api.cambiar();
}

export const formularios = {
  "tarjeta-nueva"(form, api) {
    const f = new FormData(form);
    api.datos().tarjetas.push({ id: nuevoId(), asignatura: f.get("asignatura"), pregunta: String(f.get("pregunta")).trim(), respuesta: String(f.get("respuesta")).trim(), caja: 1, proxima: hoyIso() });
    api.cambiar();
    api.aviso("Tarjeta añadida");
    setTimeout(() => document.getElementById("tjP")?.focus(), 50);
  },
  "examen-check"(form, api) {
    const f = new FormData(form);
    const ev = api.datos().eventos.find((x) => x.id === f.get("id"));
    (ev.checklist ||= []).push({ texto: String(f.get("texto")).trim(), hecho: false });
    api.cambiar();
  },
};

export const cambios = {
  "filtro-asig"(el, api) { api.estado().filtros.asignatura = el.value; api.pintar(); },
  "temp-asig"(el) { T.asignatura = el.value; },
  "temp-modo"(el, api) { const [a, b] = el.value.split("-").map(Number); T.trabajo = a; T.descanso = b; if (!T.fin) T.restante = (T.modo === "trabajo" ? a : b) * 60; api.pintar(); },
  "examen-temas"(el, api) { api.datos().eventos.find((x) => x.id === el.dataset.id).temas = el.value; api.cambiar(false); },
  "examen-check"(el, api) { const ev = api.datos().eventos.find((x) => x.id === el.dataset.id); ev.checklist[Number(el.dataset.i)].hecho = el.checked; api.cambiar(); },
};
