// =============================================================
//  sb-codigo.js — Editores del Sandbox: Web, Python y SQL
//   · Web: HTML + CSS + JS con vista previa EN DIRECTO y consola
//   · Python (programa): CPython en el navegador (Pyodide)
//   · SQL: SQLite de verdad (sql.js) con una base de ejemplo
//  Todo lo que escribes se guarda en este dispositivo.
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";
import { ejecutar as ejecutarPython } from "./python.js";
import { cargarScript } from "./sb-terminal.js";
import { WEB, PYTHON, SQL as SQL_GUIA } from "./sb-guias.js";

const CLAVE = "mochila-sandbox";
let estado = null;
export function codigo() {
  if (estado) return estado;
  try { estado = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { estado = null; }
  const w = WEB.ejemplos[1], p = PYTHON.ejemplos[1], q = SQL_GUIA.ejemplos[4];
  estado ||= {};
  estado.web ||= { html: w.html, css: w.css, js: w.js, tab: "html", ej: 1 };
  estado.py ||= { codigo: p.codigo, entradas: p.entradas || "", ej: 1 };
  estado.sql ||= { sql: q.sql, ej: 4 };
  return estado;
}
let temporizador = null;
export function guardar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { try { localStorage.setItem(CLAVE, JSON.stringify({ web: estado.web, py: estado.py, sql: estado.sql })); } catch { /* lleno */ } }, 300);
}
const salidas = { py: null, sql: null }; // resultados (no se guardan)

// ---------- Web ----------
const PUENTE = `<script>(function(){
  var enviar = function (tipo, args) { parent.postMessage({ sbConsola: true, tipo: tipo, texto: Array.prototype.map.call(args, function (a) {
    if (typeof a === "string") return a; try { return JSON.stringify(a); } catch (e) { return String(a); } }).join(" ") }, "*"); };
  ["log", "info", "warn", "error"].forEach(function (k) { var o = console[k]; console[k] = function () { enviar(k === "info" ? "log" : k, arguments); o.apply(console, arguments); }; });
  window.addEventListener("error", function (e) { enviar("error", ["Error: " + e.message + (e.lineno ? " (línea " + e.lineno + ")" : "")]); });
})();<\/script>`;
export const documentoWeb = (w) => `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${PUENTE}<style>${w.css}</style></head><body>${w.html}<script>${(w.js || "").replace(/<\/script/gi, "<\\/script")}<\/script></body></html>`;

function pintarVista() {
  const marco = document.getElementById("sbVista");
  if (!marco) return;
  const consola = document.getElementById("sbConsola");
  if (consola) { consola.innerHTML = ""; consola.dataset.vacia = "1"; }
  marco.srcdoc = documentoWeb(codigo().web);
}
if (typeof window !== "undefined") {
  window.addEventListener("message", (ev) => {
    const marco = document.getElementById("sbVista");
    if (!marco || ev.source !== marco.contentWindow || !ev.data?.sbConsola) return;
    const pre = document.getElementById("sbConsola");
    if (!pre) return;
    delete pre.dataset.vacia;
    const d = document.createElement("div");
    d.className = ev.data.tipo === "error" ? "zc-error" : ev.data.tipo === "warn" ? "zc-aviso" : "";
    d.textContent = ev.data.texto;
    pre.appendChild(d);
    pre.scrollTop = pre.scrollHeight;
  });
  // Lo que escribes se guarda al momento; la vista previa se actualiza sola
  let vivo = null;
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (!el.matches?.("textarea[data-sb]")) return;
    const c = codigo();
    const [a, b] = el.dataset.sb.split(".");
    c[a][b] = el.value;
    guardar();
    if (a === "web" && c.web.vivo !== false) { clearTimeout(vivo); vivo = setTimeout(pintarVista, 600); }
  });
}

const tarjetaEjemplo = (lista, sel, accion) => `<div class="sb-ejemplos">${lista.map((x, i) => `<button type="button" class="chip" aria-pressed="${sel === i}" data-accion="${accion}" data-i="${i}">${esc(x.t)}</button>`).join("")}</div>`;
function explicacion(ej, tipo) {
  if (!ej) return "";
  return `<details class="sb-explica" open><summary>${icono("bombilla")} Cómo funciona «${esc(ej.t)}»</summary>
      <dl>${ej.explica.map(([k, v]) => `<div><dt><code>${esc(k)}</code></dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      ${ej.prueba?.length ? `<h4>Toca y mira qué cambia</h4><div class="sb-prueba">${ej.prueba.map(([l], i) => `<button type="button" class="boton peque" data-accion="sb-prueba" data-tipo="${tipo}" data-i="${i}">${icono("chispa")} ${esc(l)}</button>`).join("")}</div>
        <p class="sb-prueba-res" id="sbPruebaRes" aria-live="polite"></p>` : ""}
    </details>`;
}

export function htmlWeb() {
  const w = codigo().web;
  const tab = ["html", "css", "js"].includes(w.tab) ? w.tab : "html";
  const nombres = { html: "HTML", css: "CSS", js: "JavaScript" };
  return `${tarjetaEjemplo(WEB.ejemplos, w.ej, "sb-web-ej")}
    <div class="sb-editor-web">
      <div class="sb-col">
        <div class="sb-tabs">${Object.entries(nombres).map(([k, l]) => `<button type="button" class="segmento" aria-pressed="${tab === k}" data-accion="sb-web-tab" data-v="${k}">${l}</button>`).join("")}
          <label class="sb-vivo"><input type="checkbox" data-accion="sb-web-vivo" ${w.vivo === false ? "" : "checked"}> En directo</label></div>
        <textarea class="codigo sb-cod" id="sbCod" data-sb="web.${tab}" spellcheck="false" autocapitalize="off" aria-label="Código ${nombres[tab]}">${esc(w[tab])}</textarea>
        <div class="fila-botones"><button class="boton principal" type="button" data-accion="sb-web-run">${icono("play")} Ejecutar</button>
          <button class="boton" type="button" data-accion="sb-web-ventana">${icono("enlace")} Abrir en otra pestaña</button></div>
      </div>
      <div class="sb-col">
        <iframe id="sbVista" class="sb-vista" title="Vista previa" sandbox="allow-scripts allow-modals allow-forms" srcdoc="${esc(documentoWeb(w))}"></iframe>
        <small class="texto-suave">Consola (lo que escribas con console.log)</small>
        <pre class="salida sb-consola" id="sbConsola" data-vacia="1"></pre>
      </div>
    </div>
    ${explicacion(WEB.ejemplos[w.ej], "web")}`;
}

// ---------- Python (programa) ----------
export function htmlPython() {
  const p = codigo().py;
  const s = salidas.py;
  return `${tarjetaEjemplo(PYTHON.ejemplos, p.ej, "sb-py-ej")}
    <textarea class="codigo sb-cod" id="sbCod" data-sb="py.codigo" spellcheck="false" autocapitalize="off" aria-label="Código Python">${esc(p.codigo)}</textarea>
    <label class="sb-entradas">Datos para input() <small>(uno por línea)</small><textarea class="codigo" id="sbEntradas" data-sb="py.entradas" rows="2" spellcheck="false">${esc(p.entradas || "")}</textarea></label>
    <div class="fila-botones"><button class="boton principal" type="button" data-accion="sb-py-run">${icono("play")} Ejecutar</button></div>
    <pre class="salida ${s?.ok === false ? "error" : ""}" id="sbSalida">${esc(s?.texto || "Pulsa Ejecutar para ver el resultado.")}</pre>
    ${explicacion(PYTHON.ejemplos[p.ej], "py")}`;
}

// ---------- SQL (sql.js = SQLite de verdad) ----------
const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
const BASE = `
CREATE TABLE alumnos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellido TEXT, grupo TEXT, edad INTEGER, ciudad TEXT);
CREATE TABLE modulos (id INTEGER PRIMARY KEY, codigo TEXT, nombre TEXT, horas INTEGER);
CREATE TABLE notas (alumno_id INTEGER REFERENCES alumnos(id), modulo_id INTEGER REFERENCES modulos(id), nota REAL);
INSERT INTO alumnos (nombre, apellido, grupo, edad, ciudad) VALUES
 ('Lorena','García','SMX2',18,'Barcelona'), ('Marc','Puig','SMX2',19,'Badalona'), ('Aitana','López','SMX2',18,'Barcelona'),
 ('Pol','Serra','SMX1',17,'Hospitalet'), ('Nerea','Martín','SMX1',17,'Barcelona'), ('Iker','Ruiz','SMX2',20,'Sabadell'),
 ('Laia','Vidal','SMX1',16,'Badalona'), ('Hugo','Moreno','SMX2',19,'Barcelona');
INSERT INTO modulos VALUES (1,'0225','Redes locales',231), (2,'0224','Sistemas operativos en red',165), (3,'0226','Seguridad informática',132),
 (4,'0227','Servicios en red',198), (5,'0228','Aplicaciones web',132);
INSERT INTO notas VALUES (1,1,8),(1,2,7.5),(1,3,9),(1,4,6),(2,1,5),(2,2,4),(2,5,7),(3,1,9.5),(3,3,8),(3,4,7),
 (4,1,6),(4,2,5.5),(5,1,7),(5,3,4),(6,2,6.5),(6,4,8),(6,5,5),(8,1,3.5),(8,3,6),(8,5,9);`;
const CLAVE_DB = "mochila-sandbox-db";
let SQL = null, cargandoSql = null, db = null;
async function baseDatos() {
  if (!SQL) {
    cargandoSql ||= cargarScript(SQLJS + "sql-wasm.js").then(() => window.initSqlJs({ locateFile: (f) => SQLJS + f })).catch((e) => { cargandoSql = null; throw e; });
    SQL = await cargandoSql;
  }
  if (!db) {
    let guardada = null;
    try { const b = localStorage.getItem(CLAVE_DB); if (b) guardada = Uint8Array.from(atob(b), (c) => c.charCodeAt(0)); } catch { /* nada */ }
    try { db = guardada ? new SQL.Database(guardada) : null; } catch { db = null; }
    if (!db) { db = new SQL.Database(); db.run(BASE); }
  }
  return db;
}
function guardarDb() {
  try {
    const bytes = db.export();
    if (bytes.length > 1_500_000) return;
    let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    localStorage.setItem(CLAVE_DB, btoa(bin));
  } catch { /* sin espacio */ }
}
const tablaHtml = (r) => `<div class="tabla-scroll"><table class="tabla-herr sb-tabla"><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${r.values.map((f) => `<tr>${f.map((v) => `<td>${v === null ? "<i>NULL</i>" : esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <small class="texto-suave">${r.values.length} fila${r.values.length === 1 ? "" : "s"}</small>`;
async function tablasActuales() {
  const base = await baseDatos();
  const r = base.exec("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  return (r[0]?.values || []).map(([n, sqlTxt]) => ({ n, cols: (sqlTxt.match(/\(([\s\S]*)\)/)?.[1] || "").split(",").map((c) => c.trim().split(/\s+/)[0]).filter((c) => c && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i.test(c)) }));
}
let esquema = null;
export async function ejecutarSql(sqlTxt) {
  const base = await baseDatos();
  try {
    const antes = base.getRowsModified();
    const res = base.exec(sqlTxt);
    const n = base.getRowsModified() - antes;
    if (/\b(insert|update|delete|create|drop|alter)\b/i.test(sqlTxt)) guardarDb();
    esquema = await tablasActuales();
    const extra = n ? `<p class="zona-ok">${n} fila${n === 1 ? "" : "s"} cambiada${n === 1 ? "" : "s"}.</p>` : "";
    return res.length ? extra + res.map(tablaHtml).join("") : extra || `<p class="zona-ok">Hecho. La orden se ha ejecutado.</p>`;
  } catch (err) {
    return `<p class="zona-err">Error: ${esc(err.message)}</p><p class="texto-suave">Pista: mira que los textos vayan entre comillas simples, que cada orden acabe en ; y que las columnas existan (míralas en «Tablas»).</p>`;
  }
}
export function htmlSql() {
  const q = codigo().sql;
  return `${tarjetaEjemplo(SQL_GUIA.ejemplos, q.ej, "sb-sql-ej")}
    <div class="sb-sql">
      <div class="sb-col">
        <textarea class="codigo sb-cod" id="sbCod" data-sb="sql.sql" spellcheck="false" autocapitalize="off" aria-label="Consulta SQL">${esc(q.sql)}</textarea>
        <div class="fila-botones"><button class="boton principal" type="button" data-accion="sb-sql-run">${icono("play")} Ejecutar</button>
          <button class="boton" type="button" data-accion="sb-sql-reset">Base de datos de nuevo</button></div>
      </div>
      <aside class="sb-esquema"><b>${icono("archivo")} Tablas</b>
        ${esquema ? esquema.map((t) => `<div><code>${esc(t.n)}</code><small>${esc(t.cols.join(", "))}</small></div>`).join("") : `<small>alumnos(id, nombre, apellido, grupo, edad, ciudad)<br>modulos(id, codigo, nombre, horas)<br>notas(alumno_id, modulo_id, nota)</small>`}
        <small class="texto-suave">Es SQLite: casi igual que MySQL (AUTOINCREMENT en vez de AUTO_INCREMENT, TEXT en vez de VARCHAR…). Tus cambios se guardan.</small></aside>
    </div>
    <div id="sbSalida" class="sb-sql-salida">${salidas.sql || ""}</div>
    ${explicacion(SQL_GUIA.ejemplos[q.ej], "sql")}`;
}

// ---------- Acciones ----------
const leerEditor = () => {
  const c = codigo();
  for (const el of document.querySelectorAll("textarea[data-sb]")) { const [a, b] = el.dataset.sb.split("."); c[a][b] = el.value; }
};
export const acciones = {
  "sb-web-tab"(b, api) { leerEditor(); codigo().web.tab = b.dataset.v; guardar(); api.pintar(); },
  "sb-web-run"() { leerEditor(); guardar(); pintarVista(); },
  "sb-web-vivo"(b) { codigo().web.vivo = b.checked; guardar(); },
  "sb-web-ventana"() {
    leerEditor();
    const url = URL.createObjectURL(new Blob([documentoWeb(codigo().web)], { type: "text/html" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  "sb-web-ej"(b, api) { const i = Number(b.dataset.i); const x = WEB.ejemplos[i]; codigo().web = { ...codigo().web, html: x.html, css: x.css, js: x.js, ej: i }; guardar(); api.pintar(); },
  "sb-py-ej"(b, api) { const i = Number(b.dataset.i); const x = PYTHON.ejemplos[i]; Object.assign(codigo().py, { codigo: x.codigo, entradas: x.entradas || "", ej: i }); salidas.py = null; guardar(); api.pintar(); },
  "sb-sql-ej"(b, api) { const i = Number(b.dataset.i); Object.assign(codigo().sql, { sql: SQL_GUIA.ejemplos[i].sql, ej: i }); salidas.sql = null; guardar(); api.pintar(); },
  async "sb-py-run"(b, api) {
    leerEditor(); guardar();
    const out = document.getElementById("sbSalida");
    out.textContent = "Ejecutando… (la primera vez tarda unos segundos en cargar Python)";
    b.disabled = true;
    try { salidas.py = await ejecutarPython(codigo().py.codigo, codigo().py.entradas || ""); }
    catch (err) { salidas.py = { ok: false, texto: err.message }; }
    api.pintar(true);
  },
  async "sb-sql-run"(b, api) {
    leerEditor(); guardar();
    document.getElementById("sbSalida").innerHTML = `<p class="texto-suave">${SQL ? "Ejecutando…" : "Cargando SQL (solo la primera vez)…"}</p>`;
    b.disabled = true;
    try { salidas.sql = await ejecutarSql(codigo().sql.sql); }
    catch (err) { salidas.sql = `<p class="zona-err">${esc(err.message)}</p>`; }
    api.pintar(true);
  },
  async "sb-sql-reset"(b, api) {
    db = null; try { localStorage.removeItem(CLAVE_DB); } catch { /* nada */ }
    if (SQL) { await baseDatos(); esquema = await tablasActuales(); }
    salidas.sql = `<p class="zona-ok">La base de datos vuelve a estar como al principio.</p>`; api.pintar(true);
  },
  // «Toca y mira qué cambia»: cambia un trozo del código, lo ejecuta y explica qué ha pasado
  async "sb-prueba"(b, api) {
    leerEditor();
    const tipo = b.dataset.tipo, c = codigo();
    const ej = (tipo === "web" ? WEB : tipo === "py" ? PYTHON : SQL_GUIA).ejemplos[c[tipo].ej];
    const [, buscar, poner, que] = ej.prueba[Number(b.dataset.i)];
    let hecho = false;
    if (buscar === "__ENTRADAS__") { c.py.entradas = poner; hecho = true; }
    else if (tipo === "web") {
      for (const k of ["html", "css", "js"]) if (c.web[k].includes(buscar)) { c.web[k] = c.web[k].split(buscar).join(poner); c.web.tab = k; hecho = true; break; }
    } else {
      const k = tipo === "py" ? "codigo" : "sql";
      if (c[tipo][k].includes(buscar)) { c[tipo][k] = c[tipo][k].split(buscar).join(poner); hecho = true; }
    }
    guardar();
    const msg = hecho ? `✔ ${que}` : "Ya lo habías cambiado (o el código es distinto). Pulsa el ejemplo arriba para empezar de nuevo.";
    if (tipo === "py" && hecho) { try { salidas.py = await ejecutarPython(c.py.codigo, c.py.entradas || ""); } catch (err) { salidas.py = { ok: false, texto: err.message }; } }
    if (tipo === "sql" && hecho) { try { salidas.sql = await ejecutarSql(c.sql.sql); } catch (err) { salidas.sql = `<p class="zona-err">${esc(err.message)}</p>`; } }
    api.pintar(true);
    const r = document.getElementById("sbPruebaRes"); if (r) r.textContent = msg;
    document.getElementById("sbCod")?.classList.add("sb-cambiado");
    // Lleva la vista a donde se ve el cambio
    if (hecho) document.getElementById(tipo === "web" ? "sbVista" : "sbSalida")?.scrollIntoView({ behavior: "smooth", block: "center" });
  },
};

// Desde la Biblioteca: abre un trozo de código en el Sandbox
export function cargarDesdeBiblioteca(lang, cod) {
  const c = codigo();
  if (["html", "css", "javascript"].includes(lang)) {
    const tab = lang === "css" ? "css" : lang === "javascript" ? "js" : "html";
    if (tab === "html" && /<html|<!DOCTYPE/i.test(cod)) c.web = { ...c.web, html: cod, css: "", js: "", tab, ej: -1 };
    else c.web = { ...c.web, [tab]: cod, tab, ej: -1 };
    guardar(); return "web";
  }
  if (lang === "python") { Object.assign(c.py, { codigo: cod, ej: -1 }); salidas.py = null; guardar(); return "python"; }
  if (lang === "sql") { Object.assign(c.sql, { sql: cod, ej: -1 }); salidas.sql = null; guardar(); return "sql"; }
  return null;
}
