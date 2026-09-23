// =============================================================
//  notas.js — Calculadora de notas por RA (NOFC Digitech 7.2 y 7.3)
//   · Cada RA: actividades 40 % + pruebas 60 %. Las dos partes ≥ 5 para hacer media.
//   · RA aprobado con 5. Si un RA no se aprueba, el módulo no se aprueba.
//   · Módulo: media ponderada de sus RA (sin decimales). Estada a l'empresa: 10 %.
//   · Ciclo: media de los módulos ponderada por horas (2 decimales).
// =============================================================
import { esc, nuevoId } from "./comun.js";
import { icono } from "./iconos.js";
import { MODULOS_OFICIALES } from "./curso.js";

const num = (v) => (v === "" || v === null || v === undefined || isNaN(Number(String(v).replace(",", "."))) ? null : Number(String(v).replace(",", ".")));
export const f1 = (n) => (n === null || n === undefined ? "—" : (Math.round(n * 100) / 100).toLocaleString("es-ES", { maximumFractionDigits: 2 }));
const redondea = (n) => Math.round(n + 1e-9);

function media(lista) {
  const v = lista.map((x) => ({ n: num(x.nota), p: num(x.peso) ?? 1 })).filter((x) => x.n !== null && x.p > 0);
  if (!v.length) return null;
  const tp = v.reduce((s, x) => s + x.p, 0);
  return v.reduce((s, x) => s + x.n * x.p, 0) / tp;
}

// Resultado de un RA
export function calcularRA(ra) {
  const act = media(ra.entradas.filter((x) => x.tipo === "actividad"));
  const pru = media(ra.entradas.filter((x) => x.tipo === "prueba"));
  const r = { act, pru, nota: null, estado: "pendiente", necesito: null, aviso: "" };
  if (num(ra.notaFinal) !== null) {
    r.nota = num(ra.notaFinal);
    r.estado = r.nota >= 5 ? "aprobado" : "suspendido";
    r.aviso = "Nota del boletín";
    return r;
  }
  if (act === null && pru === null) return r;
  if (act !== null && pru !== null) {
    const calc = 0.4 * act + 0.6 * pru;
    if (act >= 5 && pru >= 5) { r.nota = calc; r.estado = "aprobado"; }
    else {
      r.nota = Math.min(4, calc);
      r.estado = "suspendido";
      r.aviso = `${act < 5 ? "Las actividades" : "Las pruebas"} están por debajo de 5: no se puede hacer media.`;
    }
    return r;
  }
  r.estado = "proceso";
  const tengo = act ?? pru;
  const falta = act === null ? "actividades" : "pruebas";
  const pesoTengo = act === null ? 0.6 : 0.4;
  const pesoFalta = 1 - pesoTengo;
  const para = (obj) => Math.max(5, (obj - pesoTengo * tengo) / pesoFalta);
  if (tengo < 5) r.aviso = `Tus ${act === null ? "pruebas" : "actividades"} van por debajo de 5: necesitas subirlas para poder aprobar.`;
  r.necesito = { parte: falta, para5: para(5), para7: para(7), para9: para(9) };
  return r;
}

// Resultado de un módulo
export function calcularModulo(m) {
  const ras = (m?.ras || []).map((ra) => ({ ra, r: calcularRA(ra) }));
  const conNota = ras.filter((x) => x.r.nota !== null);
  const pesoCon = conNota.reduce((s, x) => s + (num(x.ra.peso) || 0), 0);
  const pesoTotal = ras.reduce((s, x) => s + (num(x.ra.peso) || 0), 0);
  let base = pesoCon ? conNota.reduce((s, x) => s + x.r.nota * (num(x.ra.peso) || 0), 0) / pesoCon : null;
  const estada = m?.estada ? num(m.notaEstada) : null;
  let nota = base;
  if (base !== null && m?.estada && estada !== null) nota = 0.9 * base + 0.1 * estada;
  const suspendido = ras.some((x) => x.r.estado === "suspendido") || (m?.estada && estada !== null && estada < 5);
  const completo = ras.length > 0 && conNota.length === ras.length && (!m?.estada || estada !== null);
  const aprobadosRA = ras.filter((x) => x.r.estado === "aprobado").length;
  return {
    ras, nota, final: completo && nota !== null ? (suspendido ? Math.min(4, redondea(nota)) : redondea(nota)) : null,
    estado: suspendido ? "suspendido" : completo ? "aprobado" : conNota.length ? "proceso" : "pendiente",
    completo, aprobadosRA, totalRA: ras.length, pesoTotal,
  };
}

// Nota del ciclo (2º + 1º), ponderada por horas oficiales
export function calcularCiclo(d) {
  const partes = [];
  for (const [id, m] of Object.entries(d.notas || {})) {
    const c = calcularModulo(m);
    const horas = num(m.horas);
    if (c.nota !== null && horas) partes.push({ n: c.final ?? c.nota, h: horas, provisional: !c.completo });
  }
  for (const p of d.notasPrimero || []) if (num(p.nota) !== null && num(p.horas)) partes.push({ n: num(p.nota), h: num(p.horas), provisional: false });
  if (!partes.length) return null;
  const h = partes.reduce((s, x) => s + x.h, 0);
  return { nota: partes.reduce((s, x) => s + x.n * x.h, 0) / h, provisional: partes.some((x) => x.provisional), modulos: partes.length };
}

// ---------- Vistas ----------
const ESTADO_TXT = { pendiente: ["Pendiente", ""], proceso: ["En proceso", "acento"], aprobado: ["Aprobado", "ok"], suspendido: ["No aprobado", "mal"] };
const chipEstado = (est) => `<span class="chip ${ESTADO_TXT[est][1]}">${ESTADO_TXT[est][0]}</span>`;
const barra = (n) => `<span class="barra-nota"><i class="${n === null ? "" : n >= 5 ? "ok" : "mal"}" style="width:${n === null ? 0 : Math.max(3, n * 10)}%"></i></span>`;
const nombreAsig = (d, id) => d.asignaturas.find((a) => a.id === id)?.nombre || id;

// Pestaña "Notas" dentro de una materia
export function htmlNotasMateria(e, id) {
  const d = e.datos;
  const m = d.notas?.[id];
  if (!m) {
    return `<div class="vacio">Esta materia todavía no tiene RA.${e.editor ? `<br><button class="boton principal" type="button" data-accion="notas-crear" data-mod="${esc(id)}" style="margin-top:12px">${icono("mas")} Configurar RA</button>` : ""}</div>`;
  }
  const c = calcularModulo(m);
  const oficial = MODULOS_OFICIALES[id];
  const resumen = `<section class="panel resumen-notas">
      <div class="nota-grande ${c.estado}"><b>${c.final ?? (c.nota === null ? "—" : f1(c.nota))}</b><small>${c.completo ? "Nota final" : c.nota === null ? "Sin notas aún" : "Nota provisional"}</small></div>
      <div class="resumen-datos">
        <div>${chipEstado(c.estado)} <span class="texto-suave">${c.aprobadosRA} de ${c.totalRA} RA aprobados</span></div>
        <p class="texto-suave">Cada RA: actividades 40 % + pruebas 60 %, las dos con 5 como mínimo.${m.estada ? " La Estada a l'empresa cuenta un 10 %." : ""}
          ${Math.abs(c.pesoTotal - 100) > 0.5 ? `<br><b>Los pesos de los RA suman ${f1(c.pesoTotal)} %, no 100 %.</b>` : ""}</p>
        ${m.estada ? `<label class="campo-inline">Estada a l'empresa ${e.editor ? `<input type="text" inputmode="decimal" data-cambio="nota-estada" data-mod="${esc(id)}" value="${esc(m.notaEstada ?? "")}" placeholder="nota">` : `<b>${esc(m.notaEstada || "—")}</b>`}</label>` : ""}
      </div>
    </section>`;
  const ras = c.ras.map(({ ra, r }) => {
    const entradas = ra.entradas.map((x) => `<li><span class="chip ${x.tipo === "prueba" ? "acento" : ""}">${x.tipo === "prueba" ? "Prueba" : "Actividad"}</span>
        <span class="en-nombre">${esc(x.nombre || "")}</span><b>${esc(String(x.nota).replace(".", ","))}</b>
        ${e.editor ? `<button type="button" class="boton icono peque" data-accion="nota-quitar" data-mod="${esc(id)}" data-ra="${esc(ra.id)}" data-entrada="${esc(x.id)}" aria-label="Quitar">${icono("cerrar")}</button>` : ""}</li>`).join("");
    const nec = r.necesito;
    return `<article class="panel ra">
      <header class="ra-cab"><div><span class="codigo-ra">${esc(ra.id)}</span> <span class="texto-suave">peso ${e.editor ? `<input class="peso" type="text" inputmode="decimal" data-cambio="ra-peso" data-mod="${esc(id)}" data-ra="${esc(ra.id)}" value="${esc(ra.peso)}">` : esc(f1(num(ra.peso)))} %</span></div>
        <div class="ra-nota">${chipEstado(r.estado)}<b>${r.nota === null ? "—" : f1(r.nota)}</b></div></header>
      <p class="ra-nombre">${esc(ra.nombre)}</p>
      <div class="ra-partes">
        <div><small>Actividades · 40 %</small>${barra(r.act)}<b>${f1(r.act)}</b></div>
        <div><small>Pruebas · 60 %</small>${barra(r.pru)}<b>${f1(r.pru)}</b></div>
      </div>
      ${nec ? `<div class="necesito">${icono("bandera")}<span>Para aprobar necesitas <b>${nec.para5 > 10 ? "más de 10" : f1(nec.para5)}</b> de media en ${nec.parte}.
        ${nec.para7 <= 10 ? `Para un 7: <b>${f1(nec.para7)}</b>.` : ""} ${nec.para9 <= 10 ? `Para un 9: <b>${f1(nec.para9)}</b>.` : ""}</span></div>` : ""}
      ${r.aviso ? `<p class="aviso-ra">${esc(r.aviso)}</p>` : ""}
      ${entradas ? `<ul class="entradas">${entradas}</ul>` : ""}
      ${e.editor ? `<form class="form-nota" data-form="nota-entrada">
          <input type="hidden" name="mod" value="${esc(id)}"><input type="hidden" name="ra" value="${esc(ra.id)}">
          <select name="tipo" aria-label="Tipo"><option value="actividad">Actividad</option><option value="prueba">Prueba</option></select>
          <input name="nombre" placeholder="Nombre (p. ej. Pràctica 2)" aria-label="Nombre">
          <input name="nota" required inputmode="decimal" placeholder="Nota" aria-label="Nota" class="corto">
          <button class="boton" type="submit">${icono("mas")} Añadir</button>
        </form>
        <div class="ra-extra"><label>Nota del boletín (si ya está cerrado) <input type="text" inputmode="decimal" class="corto" data-cambio="ra-final" data-mod="${esc(id)}" data-ra="${esc(ra.id)}" value="${esc(ra.notaFinal ?? "")}"></label>
          <button type="button" class="enlace-ver" data-accion="ra-editar" data-mod="${esc(id)}" data-ra="${esc(ra.id)}">Editar nombre</button>
          <button type="button" class="enlace-ver" data-accion="ra-quitar" data-mod="${esc(id)}" data-ra="${esc(ra.id)}">Quitar RA</button></div>` : ""}
    </article>`;
  }).join("");
  return `${resumen}<div class="lista-ra">${ras}</div>
    ${e.editor ? `<div class="barra-acciones"><button class="boton" type="button" data-accion="ra-anadir" data-mod="${esc(id)}">${icono("mas")} Añadir RA</button>
      ${oficial ? `<span class="nota-pie">RA del currículo oficial IC10. Los pesos los decide cada profe: cámbialos cuando os los digan.</span>` : ""}</div>` : ""}`;
}

// Página general "Notas": todos los módulos + nota del ciclo
export function vistaNotas(e) {
  const d = e.datos;
  const ciclo = calcularCiclo(d);
  const mods = Object.entries(d.notas || {}).map(([id, m]) => ({ id, m, c: calcularModulo(m), a: d.asignaturas.find((x) => x.id === id) }));
  const raTot = mods.reduce((s, x) => s + x.c.totalRA, 0);
  const raOk = mods.reduce((s, x) => s + x.c.aprobadosRA, 0);
  const tarjetas = mods.map(({ id, c, a }) => `<button type="button" class="panel modulo-nota" data-ir="materia/${esc(id)}/notas" style="--color:${esc(a?.color || "var(--acento)")}">
      <span class="mn-cab"><span class="mn-cod">${esc(id)}</span>${chipEstado(c.estado)}</span>
      <b class="mn-nombre">${esc((a?.nombre || id).replace(/^\d{3,4}\s*/, ""))}</b>
      <span class="mn-nota ${c.estado}">${c.final ?? (c.nota === null ? "—" : f1(c.nota))}</span>
      <span class="mn-ras">${c.ras.map(({ ra, r }) => `<i title="${esc(ra.id)}: ${r.nota === null ? "sin nota" : f1(r.nota)}" class="${r.estado}"></i>`).join("")}</span>
      <small class="texto-suave">${c.aprobadosRA}/${c.totalRA} RA aprobados</small>
    </button>`).join("");
  const primero = (d.notasPrimero || []).map((p) => `<tr><td><span class="mn-cod">${esc(p.codigo)}</span> ${esc(p.nombre)}</td><td>${esc(p.horas)} h</td>
      <td>${e.editor ? `<input type="text" inputmode="decimal" class="corto" data-cambio="nota-primero" data-id="${esc(p.id)}" value="${esc(p.nota ?? "")}" placeholder="—">` : `<b>${esc(p.nota || "—")}</b>`}</td></tr>`).join("");
  return `<header class="cabecera-seccion"><div><h1>Notas</h1><p>Calculadas con las normas del centro: RA, 40/60 y nota del ciclo por horas.</p></div></header>
    <div class="kpis">
      <div class="panel kpi"><span class="kpi-num">${ciclo ? f1(ciclo.nota) : "—"}</span><span class="kpi-que">Nota del ciclo${ciclo?.provisional ? " (provisional)" : ""}</span></div>
      <div class="panel kpi"><span class="kpi-num">${raOk}<small>/${raTot}</small></span><span class="kpi-que">RA aprobados</span></div>
      <div class="panel kpi"><span class="kpi-num">${mods.filter((x) => x.c.estado === "aprobado").length}<small>/${mods.length}</small></span><span class="kpi-que">Módulos de 2º aprobados</span></div>
    </div>
    <div class="modulos-nota">${tarjetas}</div>
    <section class="panel" style="margin-top:20px"><div class="panel-titulo"><h2>${icono("formacion")} Módulos de 1º</h2></div>
      <p class="texto-suave">Pon la nota final de cada módulo de 1º para calcular la nota del ciclo. Deja en blanco los que no cursaste.</p>
      <table class="tabla"><thead><tr><th>Módulo</th><th>Horas</th><th>Nota</th></tr></thead><tbody>${primero}</tbody></table>
    </section>`;
}

// ---------- Acciones (solo en modo edición) ----------
const modDe = (api, id) => api.datos().notas[id];
const raDe = (api, mod, ra) => modDe(api, mod)?.ras.find((x) => x.id === ra);

export const acciones = {
  "notas-crear"(b, api) {
    const d = api.datos();
    d.notas[b.dataset.mod] = { horas: "", estada: false, notaEstada: "", ras: [{ id: "RA1", nombre: "Resultat d'aprenentatge 1", peso: 100, entradas: [] }] };
    api.cambiar();
  },
  "nota-quitar"(b, api) {
    const ra = raDe(api, b.dataset.mod, b.dataset.ra);
    if (!ra) return;
    ra.entradas = ra.entradas.filter((x) => x.id !== b.dataset.entrada);
    api.cambiar();
  },
  async "ra-anadir"(b, api) {
    const m = modDe(api, b.dataset.mod);
    const nombre = await api.pedirTexto("Nombre del nuevo RA", "");
    if (!nombre) return;
    const n = m.ras.length + 1;
    m.ras.push({ id: `RA${n}`, nombre, peso: 0, entradas: [] });
    api.cambiar();
    api.aviso("RA añadido. Ajusta los pesos para que sumen 100 %.");
  },
  async "ra-editar"(b, api) {
    const ra = raDe(api, b.dataset.mod, b.dataset.ra);
    const nombre = await api.pedirTexto("Nombre del RA", ra.nombre);
    if (nombre) { ra.nombre = nombre; api.cambiar(); }
  },
  async "ra-quitar"(b, api) {
    const m = modDe(api, b.dataset.mod);
    if (!(await api.confirmar(`¿Quitar ${b.dataset.ra} y sus notas?`))) return;
    m.ras = m.ras.filter((x) => x.id !== b.dataset.ra);
    api.cambiar();
  },
};

export const formularios = {
  "nota-entrada"(form, api) {
    const f = new FormData(form);
    const nota = num(f.get("nota"));
    if (nota === null || nota < 0 || nota > 10) return api.aviso("La nota tiene que ser un número entre 0 y 10.");
    const ra = raDe(api, f.get("mod"), f.get("ra"));
    ra.entradas.push({ id: nuevoId(), tipo: f.get("tipo"), nombre: String(f.get("nombre") || "").trim(), nota });
    api.cambiar();
  },
};

export const cambios = {
  "ra-peso"(el, api) { const ra = raDe(api, el.dataset.mod, el.dataset.ra); ra.peso = num(el.value) ?? 0; api.cambiar(); },
  "ra-final"(el, api) { const ra = raDe(api, el.dataset.mod, el.dataset.ra); ra.notaFinal = el.value.trim(); api.cambiar(); },
  "nota-estada"(el, api) { modDe(api, el.dataset.mod).notaEstada = el.value.trim(); api.cambiar(); },
  "nota-primero"(el, api) { const p = api.datos().notasPrimero.find((x) => x.id === el.dataset.id); p.nota = el.value.trim(); api.cambiar(); },
};

// Para el asistente y el modo examen
export function resumenNotas(d, id) {
  const m = d.notas?.[id];
  if (!m) return null;
  return calcularModulo(m);
}
export { nombreAsig };
