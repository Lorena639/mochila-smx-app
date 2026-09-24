// =============================================================
//  sandbox.js — Sandbox: practicar sin miedo a romper nada
//   · Linux (máquina virtual de verdad) · Windows (simulado)
//   · Git (de verdad) · Python (de verdad) · SQL (SQLite de verdad)
//   · Web (HTML + CSS + JS en directo)
//  A la derecha: guía paso a paso y chuleta para consultar.
// =============================================================
import { esc, normalizar } from "./comun.js";
import { icono } from "./iconos.js";
import { cargarXterm, TECLAS_MOVIL } from "./sb-terminal.js";
import { linux } from "./sb-linux.js";
import { windows } from "./sb-windows.js";
import { git } from "./sb-git.js";
import { python } from "./sb-python.js";
import * as Codigo from "./sb-codigo.js";
import { LINUX, WINDOWS, GIT, PYTHON, SQL, WEB } from "./sb-guias.js";

export const ENTORNOS = [
  { id: "linux", t: "Linux", ic: "terminal", real: true, desc: "Una máquina virtual con Linux de verdad (Buildroot + BusyBox)", guia: LINUX,
    que: "Es un PC virtual que arranca un Linux de verdad dentro de la app. Todo lo que escribes lo ejecuta Linux. Si rompes algo, pulsa Reiniciar y vuelve a estar como nuevo." },
  { id: "windows", t: "Windows", ic: "terminal", real: false, desc: "PowerShell y CMD con las salidas de Windows 11", guia: WINDOWS,
    que: "Windows no puede funcionar dentro del navegador, así que esto es una simulación muy fiel: mismas órdenes, mismas salidas y mismos errores que en un Windows 11 en castellano. Lo que creas se guarda." },
  { id: "git", t: "Git", ic: "cuadricula", real: true, desc: "git de verdad: commits, ramas, merge, clone…", guia: GIT,
    que: "Es git de verdad (isomorphic-git). Tus repositorios se guardan en este dispositivo. Para editar archivos usa nano." },
  { id: "python", t: "Python", ic: "chispa", real: true, desc: "Consola >>> y programas, con Python 3 de verdad", guia: PYTHON,
    que: "Es Python 3 de verdad funcionando en el navegador. En «Consola» pruebas línea a línea; en «Programa» escribes un programa entero." },
  { id: "sql", t: "SQL", ic: "archivo", real: true, desc: "Base de datos SQLite con alumnos, módulos y notas", guia: SQL,
    que: "Una base de datos SQLite de verdad con tablas de ejemplo. Puedes consultar, insertar, borrar y crear tablas: tus cambios se guardan." },
  { id: "web", t: "Web", ic: "web", real: true, desc: "HTML, CSS y JavaScript con vista previa en directo", guia: WEB,
    que: "Escribe HTML, CSS y JavaScript y mira el resultado al momento. La consola de abajo enseña lo que escribas con console.log." },
];
const TERMINALES = { linux, windows, git, python };

// ---------- Estado de la guía (qué lección, qué pasos has hecho) ----------
const CLAVE = "mochila-sandbox-guia";
let guia = null;
function estadoGuia() {
  if (guia) return guia;
  try { guia = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { guia = null; }
  guia ||= {};
  guia.leccion ||= {}; guia.hechos ||= {}; guia.panel ||= {};
  return guia;
}
const guardarGuia = () => { try { localStorage.setItem(CLAVE, JSON.stringify(guia)); } catch { /* nada */ } };

// ---------- Vista ----------
export function vistaSandbox(e, id = "") {
  const ent = ENTORNOS.find((x) => x.id === id) || ENTORNOS.find((x) => x.id === estadoGuia().ultimo) || ENTORNOS[0];
  if (estadoGuia().ultimo !== ent.id) { guia.ultimo = ent.id; guardarGuia(); }
  const modoPy = ent.id === "python" ? (guia.modoPy || "consola") : "";
  return `<header class="sb-hero">
      <div><h1>${icono("cubo")} Sandbox</h1><p>Tu laboratorio para practicar sin miedo a romper nada. Sigue la guía paso a paso o escribe lo que quieras: a la derecha tienes la chuleta.</p></div>
    </header>
    <nav class="sb-entornos" aria-label="Entornos">${ENTORNOS.map((x) => `<a class="sb-entorno ${x.id === ent.id ? "activo" : ""}" href="#sandbox/${x.id}" ${x.id === ent.id ? 'aria-current="page"' : ""}>
      ${icono(x.ic)}<span><b>${x.t}</b><small>${x.real ? "De verdad" : "Simulado"}</small></span></a>`).join("")}</nav>
    <section class="panel sb-area">
      <div class="sb-cab">
        <div><h2>${esc(ent.t)} <span class="chip ${ent.real ? "ok" : "aviso"}">${ent.real ? "De verdad" : "Simulado"}</span></h2><p>${esc(ent.que)}</p></div>
        <div class="fila-botones">${botonesCab(ent.id)}</div>
      </div>
      ${ent.id === "python" ? `<div class="segmentos sb-modos">${[["consola", "Consola >>>"], ["programa", "Programa .py"]].map(([v, l]) => `<button type="button" class="segmento" aria-pressed="${modoPy === v}" data-accion="sb-py-modo" data-v="${v}">${l}</button>`).join("")}</div>` : ""}
      <div class="sb-rejilla">
        <div class="sb-main">${principal(ent.id, modoPy)}</div>
        <aside class="sb-ayuda">${ayuda(ent, modoPy)}</aside>
      </div>
    </section>`;
}

function botonesCab(id) {
  if (id === "linux") {
    if (linux.estado === "listo") return `<button type="button" class="boton peque" data-accion="sb-reiniciar" data-e="linux">${icono("reiniciar")} Reiniciar</button><button type="button" class="boton peque" data-accion="sb-apagar">Apagar</button>`;
    return "";
  }
  if (["windows", "git"].includes(id)) return `<button type="button" class="boton peque" data-accion="sb-reiniciar" data-e="${id}">${icono("reiniciar")} Empezar de cero</button>`;
  return "";
}

function principal(id, modoPy) {
  if (id === "web") return Codigo.htmlWeb();
  if (id === "sql") return Codigo.htmlSql();
  if (id === "python" && modoPy === "programa") return Codigo.htmlPython();
  if (id === "linux" && linux.estado !== "listo") {
    const cargando = ["descargando", "arrancando"].includes(linux.estado);
    if (cargando) return `<div class="sb-term-zona" id="sbTerm"><div class="sb-overlay"><div class="sb-girando"></div><p id="sbProgreso">${esc(linux.progreso)}</p></div></div>`;
    return `<div class="sb-arranque">
        <div class="sb-pantalla">${icono("terminal")}<p>Linux está apagado</p></div>
        ${linux.estado === "error" ? `<p class="zona-err">${esc(linux.error)}</p>` : ""}
        <button type="button" class="boton principal" data-accion="sb-encender">${icono("play")} Encender Linux</button>
        <p class="texto-suave">La primera vez descarga unos 8 MB (luego queda guardado y arranca en segundos). Es un Linux de verdad, sin internet: no puede tocar nada de tu móvil ni de tu PC.</p>
      </div>`;
  }
  const t = TERMINALES[id];
  const nano = id === "git" && git.editando ? htmlNano() : "";
  return `<div class="sb-term-zona ${nano ? "con-nano" : ""}" id="sbTerm">${t?.t ? "" : `<p class="sb-cargando">Cargando la terminal…</p>`}${nano}</div>
    <div class="sb-teclas" aria-label="Teclas especiales">${TECLAS_MOVIL.map(([l], i) => `<button type="button" data-accion="sb-tecla" data-i="${i}">${esc(l)}</button>`).join("")}</div>`;
}

function htmlNano() {
  const e = git.editando;
  return `<div class="sb-nano" role="dialog" aria-label="Editor nano">
    <div class="sb-nano-cab"><span>GNU nano 7.2</span><b>${esc(e.nombre)}</b><span></span></div>
    <textarea id="sbNano" spellcheck="false" autocapitalize="off">${esc(e.texto)}</textarea>
    <div class="sb-nano-pie"><button type="button" data-accion="sb-nano" data-v="guardar"><b>^O</b> Guardar</button><button type="button" data-accion="sb-nano" data-v="salir"><b>^X</b> Guardar y salir</button><button type="button" data-accion="sb-nano" data-v="descartar"><b>Esc</b> Salir sin guardar</button></div>
  </div>`;
}

// ---------- Panel de ayuda: guía y chuleta ----------
function ayuda(ent, modoPy) {
  const g = estadoGuia();
  const tieneLecciones = ent.guia.lecciones && !(ent.id === "python" && modoPy === "programa");
  const panel = tieneLecciones ? (g.panel[ent.id] || "guia") : "chuleta";
  const tabs = tieneLecciones ? `<div class="segmentos sb-ayuda-tabs">${[["guia", "Paso a paso"], ["chuleta", "Chuleta"]].map(([v, l]) => `<button type="button" class="segmento" aria-pressed="${panel === v}" data-accion="sb-panel" data-e="${ent.id}" data-v="${v}">${l}</button>`).join("")}</div>` : `<h3 class="sb-ayuda-tit">${icono("materias")} Chuleta</h3>`;
  return tabs + (panel === "guia" ? htmlGuia(ent) : htmlChuleta(ent));
}
function htmlGuia(ent) {
  const g = estadoGuia();
  const lecciones = ent.guia.lecciones;
  const i = Math.min(g.leccion[ent.id] || 0, lecciones.length - 1);
  const l = lecciones[i];
  const hechos = g.hechos[`${ent.id}.${i}`] || [];
  return `<div class="sb-lecciones">${lecciones.map((x, k) => { const h = (g.hechos[`${ent.id}.${k}`] || []).length; const fin = h >= x.pasos.length;
      return `<button type="button" class="chip ${fin ? "ok" : ""}" aria-pressed="${k === i}" data-accion="sb-leccion" data-e="${ent.id}" data-i="${k}">${fin ? "✓ " : ""}${esc(x.t)}</button>`; }).join("")}</div>
    <p class="sb-intro">${esc(l.intro)}</p>
    <ol class="sb-pasos">${l.pasos.map(([cmd, exp], k) => `<li class="${hechos.includes(k) ? "hecho" : ""}">
        <div class="sb-paso-cmd"><code>${esc(cmd.trim())}</code>
          <button type="button" class="boton icono peque" data-accion="sb-paso" data-e="${ent.id}" data-i="${k}" aria-label="Escribirlo y ejecutarlo">${icono("play")}</button></div>
        <p>${esc(exp)}</p></li>`).join("")}</ol>
    ${i < lecciones.length - 1 ? `<button type="button" class="boton peque ancho-completo" data-accion="sb-leccion" data-e="${ent.id}" data-i="${i + 1}">Siguiente: ${esc(lecciones[i + 1].t)} ${icono("flecha-der")}</button>` : `<p class="texto-suave">¡Has llegado al final! Ahora prueba tú lo que quieras.</p>`}
    <p class="nota-pie">Pulsa ${icono("play")} para que se escriba y se ejecute, o escríbelo tú (se aprende más). Tab autocompleta y ↑ repite órdenes.</p>`;
}
function htmlChuleta(ent) {
  const escribible = Boolean(TERMINALES[ent.id]);
  return `<label class="buscador sb-buscar">${icono("buscar")}<input type="search" data-sb-filtro placeholder="Buscar en la chuleta…" aria-label="Buscar en la chuleta"></label>
    <div class="sb-chuleta">${ent.guia.chuleta.map((grupo) => `<section><h4>${esc(grupo.t)}</h4><table><tbody>${grupo.filas.map(([c, d]) => `<tr data-busca="${esc(normalizar(`${c} ${d}`))}">
      <td>${escribible ? `<button type="button" class="sb-escribir" data-accion="sb-escribir" data-e="${ent.id}" data-v="${esc(c.split(" · ")[0])}" title="Escribirlo en la terminal"><code>${esc(c)}</code></button>` : `<code>${esc(c)}</code>`}</td><td>${esc(d)}</td></tr>`).join("")}</tbody></table></section>`).join("")}</div>
    ${escribible ? `<p class="nota-pie">Toca una orden para escribirla en la terminal (sin ejecutarla), así la completas tú.</p>` : ""}
    ${ent.id === "windows" ? htmlRetosWin() : ""}`;
}
function htmlRetosWin() {
  if (!windows.s) return "";
  const r = windows.retos(); const n = r.filter(([, ok]) => ok).length;
  return `<h4 class="sb-retos-tit">${icono("bandera")} Retos <span class="chip ${n === r.length ? "ok" : ""}">${n}/${r.length}</span></h4>
    <ul class="checklist">${r.map(([t, ok]) => `<li><label><input type="checkbox" disabled ${ok ? "checked" : ""}> <span>${esc(t)}</span></label></li>`).join("")}</ul>`;
}

// ---------- Montar las terminales después de pintar ----------
let apiActual = null;
export async function montar(api) {
  apiActual = api || apiActual;
  const sitio = document.getElementById("sbTerm");
  const id = (location.hash.split("/")[1] || estadoGuia().ultimo || "linux").split("?")[0];
  // Linux solo gasta batería mientras se ve
  if (!sitio || id !== "linux") linux.pausar(); else linux.seguir();
  if (!sitio) return;
  const t = TERMINALES[id];
  if (!t) return;
  if (id === "linux") { if (!linux.t) return; }
  else if (!t.t) {
    try { await cargarXterm(); } catch (err) { sitio.innerHTML = `<p class="zona-err">${esc(err.message)}</p>`; return; }
    if (id === "git") git.alEditar = () => apiActual?.pintar(true);
    await t.iniciar();
    if (!t.t) return;
  }
  const actual = document.getElementById("sbTerm");
  if (!actual) return;
  actual.querySelector(".sb-cargando")?.remove();
  if (t.t.host.parentNode !== actual) actual.prepend(t.t.host);
  // Linux ya arrancado: no se cambia el tamaño (la máquina ya sabe cuántas columnas tiene)
  t.t.ajustar(id === "linux" && linux.estado === "listo");
  if (id === "git" && git.editando) { setTimeout(() => document.getElementById("sbNano")?.focus(), 30); return; }
  if (matchMedia("(pointer: fine)").matches && !document.activeElement?.matches("input, textarea")) t.t.term.focus();
}
if (typeof window !== "undefined") {
  let r = null;
  window.addEventListener("resize", () => { clearTimeout(r); r = setTimeout(() => { for (const [k, t] of Object.entries(TERMINALES)) if (t.t?.host.isConnected && !(k === "linux" && linux.estado === "listo")) t.t.ajustar(); }, 200); });
  // Las teclas de abajo no le quitan el foco a la terminal (el teclado del móvil no se cierra)
  document.addEventListener("pointerdown", (ev) => { if (ev.target.closest?.(".sb-teclas button, .sb-escribir")) ev.preventDefault(); });
  // Buscar en la chuleta sin repintar
  document.addEventListener("input", (ev) => {
    if (!ev.target.matches?.("[data-sb-filtro]")) return;
    const q = normalizar(ev.target.value);
    const zona = ev.target.closest(".sb-ayuda");
    zona.querySelectorAll("tr[data-busca]").forEach((tr) => { tr.hidden = q && !tr.dataset.busca.includes(q); });
    zona.querySelectorAll(".sb-chuleta section").forEach((s) => { s.hidden = ![...s.querySelectorAll("tr")].some((tr) => !tr.hidden); });
  });
  // Atajos de nano: Ctrl+O guarda, Ctrl+X guarda y sale, Esc sale sin guardar
  document.addEventListener("keydown", (ev) => {
    if (ev.target.id !== "sbNano") return;
    const k = ev.key.toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && (k === "o" || k === "s")) { ev.preventDefault(); git.guardarSinSalir(ev.target.value); }
    else if ((ev.ctrlKey || ev.metaKey) && k === "x") { ev.preventDefault(); git.cerrarEditor(true, ev.target.value); }
    else if (k === "escape") { ev.preventDefault(); git.cerrarEditor(false); }
    else if (k === "tab") { ev.preventDefault(); const t = ev.target, i = t.selectionStart; t.value = t.value.slice(0, i) + "    " + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = i + 4; }
  });
}

// ---------- Acciones ----------
const escribirEn = (id, texto, ejecutar) => {
  const t = TERMINALES[id];
  if (!t) return;
  if (id === "linux") { linux.enviar(texto + (ejecutar ? "\r" : "")); return; }
  t.enviar?.(texto + (ejecutar ? "\r" : ""));
  setTimeout(() => t.t?.term.focus(), 20);
};
export const acciones = {
  ...Codigo.acciones,
  "sb-encender"(b, api) { linux.encender(() => api.pintar(true)); },
  async "sb-apagar"(b, api) { if (await api.confirmar?.("¿Apagar Linux? Se perderá lo que hayas hecho en él.") === false) return; await linux.apagar(); api.pintar(true); },
  async "sb-reiniciar"(b, api) {
    const id = b.dataset.e;
    const txt = id === "linux" ? "¿Reiniciar Linux? Vuelve a estar como nuevo y se pierde lo que hayas creado." : id === "git" ? "¿Borrar todos tus repositorios del Sandbox y empezar de cero?" : "¿Volver a empezar la consola de Windows desde cero?";
    if (await api.confirmar?.(txt) === false) return;
    if (id === "linux") { await linux.apagar(); linux.encender(() => api.pintar(true)); }
    if (id === "windows") windows.reiniciar();
    if (id === "git") await git.reiniciar();
    api.pintar(true);
  },
  "sb-tecla"(b) {
    const id = (location.hash.split("/")[1] || estadoGuia().ultimo || "linux");
    const seq = TECLAS_MOVIL[Number(b.dataset.i)][1];
    if (id === "linux") linux.enviar(seq); else TERMINALES[id]?.enviar(seq);
  },
  "sb-py-modo"(b, api) { estadoGuia().modoPy = b.dataset.v; guardarGuia(); api.pintar(true); },
  "sb-panel"(b, api) { estadoGuia().panel[b.dataset.e] = b.dataset.v; guardarGuia(); api.pintar(true); },
  "sb-leccion"(b, api) { estadoGuia().leccion[b.dataset.e] = Number(b.dataset.i); guardarGuia(); api.pintar(true); document.querySelector(".sb-ayuda")?.scrollIntoView({ block: "nearest" }); },
  "sb-paso"(b, api) {
    const id = b.dataset.e, g = estadoGuia();
    const i = g.leccion[id] || 0;
    const ent = ENTORNOS.find((x) => x.id === id);
    const [cmd] = ent.guia.lecciones[i].pasos[Number(b.dataset.i)];
    if (id === "linux" && linux.estado !== "listo") { linux.pendiente += cmd + "\r"; if (linux.estado === "apagado" || linux.estado === "error") linux.encender(() => api.pintar(true)); }
    else if (id === "python" && (g.modoPy || "consola") !== "consola") { g.modoPy = "consola"; }
    else escribirEn(id, cmd, true);
    const k = `${id}.${i}`;
    g.hechos[k] = [...new Set([...(g.hechos[k] || []), Number(b.dataset.i)])];
    guardarGuia();
    b.closest("li")?.classList.add("hecho");
    const todos = ent.guia.lecciones[i].pasos.length;
    if (g.hechos[k].length >= todos) api.pintar(true);
    if (!matchMedia("(pointer: fine)").matches) document.getElementById("sbTerm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  },
  "sb-escribir"(b) { escribirEn(b.dataset.e, b.dataset.v, false); },
  "sb-nano"(b) {
    const ta = document.getElementById("sbNano"); if (!ta) return;
    if (b.dataset.v === "descartar") return git.cerrarEditor(false);
    if (b.dataset.v === "salir") return git.cerrarEditor(true, ta.value);
    git.guardarSinSalir(ta.value);
  },
};

// Desde la Biblioteca: «Probar en Sandbox»
export function abrirDesdeBiblioteca(lang, cod) {
  const destino = Codigo.cargarDesdeBiblioteca(lang, cod);
  if (destino) { if (destino === "python") { estadoGuia().modoPy = "programa"; guardarGuia(); } return destino; }
  const terminal = { bash: "linux", windows: "windows", git: "git" }[lang];
  if (!terminal) return null;
  const linea = cod.split("\n").find((l) => l.trim() && !l.trim().startsWith("#")) || "";
  setTimeout(() => escribirEn(terminal, linea.trim(), false), terminal === "linux" ? 0 : 600);
  return terminal;
}
export const sePuedeProbar = (lang) => ["html", "css", "javascript", "python", "sql", "bash", "windows", "git"].includes(lang);
