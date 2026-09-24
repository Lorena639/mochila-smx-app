// =============================================================
//  zona.js — Zona de pruebas de la Biblioteca
//   · HTML / CSS / JavaScript: editor + vista previa + consola
//   · Python: Pyodide (el mismo del Plan Python)
//   · SQL: SQLite en el navegador (sql.js) con una base de ejemplo
//   · Bash y Git: terminal Linux simulada · Windows: CMD/PowerShell
//   · Java, C, C++ y PHP: el navegador no los puede compilar →
//     se copia el código y se abre un compilador online
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";
import { ejecutar as ejecutarPython } from "./python.js";
import { htmlConsola } from "./consolas.js";

export const TIPO_ZONA = {
  html: "web", css: "web", javascript: "web", python: "python", sql: "sql",
  bash: "linux", git: "linux", windows: "windows", php: "online", java: "online", c: "online", cpp: "online",
};
const ONLINE = {
  java: { url: "https://www.onlinegdb.com/online_java_compiler", nombre: "Java", ej: 'public class Main {\n    public static void main(String[] args) {\n        String nombre = "Lorena";\n        for (int i = 1; i <= 3; i++) {\n            System.out.println("Hola " + nombre + " " + i);\n        }\n    }\n}\n' },
  c: { url: "https://www.onlinegdb.com/online_c_compiler", nombre: "C", ej: '#include <stdio.h>\n\nint main(void) {\n    int notas[] = {7, 5, 9};\n    int suma = 0;\n    for (int i = 0; i < 3; i++) suma += notas[i];\n    printf("Media: %.2f\\n", suma / 3.0);\n    return 0;\n}\n' },
  cpp: { url: "https://www.onlinegdb.com/online_c++_compiler", nombre: "C++", ej: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<string> modulos = {"Redes", "Sistemas", "Seguridad"};\n    for (const auto& m : modulos) cout << m << endl;\n    return 0;\n}\n' },
  php: { url: "https://www.onlinegdb.com/online_php_interpreter", nombre: "PHP", ej: '<?php\n$nombre = "Lorena";\n$notas = [7, 5, 9];\necho "Hola $nombre\\n";\necho "Media: " . array_sum($notas) / count($notas) . "\\n";\n' },
};
const WEB_INICIO = {
  html: '<h1>Hola, Lorena</h1>\n<p class="nota">Cambia el código y pulsa Ejecutar.</p>\n<button id="boton">Púlsame</button>\n',
  css: 'body { font-family: sans-serif; padding: 12px; }\nh1 { color: #0e7490; }\n.nota { background: #fef3c7; padding: 6px 10px; border-radius: 6px; }\n',
  js: 'console.log("Hola desde JavaScript");\n\ndocument.getElementById("boton").addEventListener("click", () => {\n  console.log("¡Has hecho clic!");\n});\n',
};
const PY_INICIO = 'nombre = "Lorena"\nnotas = [7, 5, 9]\nprint(f"Hola, {nombre}")\nprint("Media:", sum(notas) / len(notas))\n';
const SQL_INICIO = "-- Tablas: alumnos, modulos, notas\nSELECT nombre, apellido, ciudad\nFROM alumnos\nWHERE grupo = 'SMX2'\nORDER BY nombre;\n";

function zona(t) {
  t.zona ||= {};
  t.zona.web ||= { ...WEB_INICIO, tab: "html" };
  t.zona.python ??= PY_INICIO;
  t.zona.sql ??= SQL_INICIO;
  for (const [k, o] of Object.entries(ONLINE)) t.zona[k] ??= o.ej;
  return t.zona;
}

// Lo que se escribe en el editor se guarda sin repintar (para no perder el cursor)
let herrActual = null;
if (typeof document !== "undefined") {
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (!herrActual || !el.matches?.("textarea[data-zona]")) return;
    const z = zona(herrActual);
    const [a, b] = el.dataset.zona.split(".");
    if (b) z[a][b] = el.value; else z[a] = el.value;
  });
  // Mensajes de console.log que manda la vista previa
  window.addEventListener("message", (ev) => {
    const marco = document.getElementById("zonaVista");
    if (!marco || ev.source !== marco.contentWindow || !ev.data?.zonaConsola) return;
    const pre = document.getElementById("zonaConsola");
    if (!pre) return;
    if (pre.dataset.vacia) { pre.textContent = ""; delete pre.dataset.vacia; }
    const linea = document.createElement("div");
    linea.className = ev.data.tipo === "error" ? "zc-error" : ev.data.tipo === "warn" ? "zc-aviso" : "";
    linea.textContent = ev.data.texto;
    pre.appendChild(linea);
    pre.scrollTop = pre.scrollHeight;
  });
}

// ---------- Web ----------
const PUENTE = `<script>(function(){
  const enviar = (tipo, args) => parent.postMessage({ zonaConsola: true, tipo, texto: args.map((a) => {
    if (typeof a === "string") return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }).join(" ") }, "*");
  ["log", "info", "warn", "error"].forEach((k) => { const o = console[k]; console[k] = (...a) => { enviar(k === "info" ? "log" : k, a); o.apply(console, a); }; });
  window.addEventListener("error", (e) => enviar("error", ["Error: " + e.message + (e.lineno ? " (línea " + e.lineno + ")" : "")]));
})();<\/script>`;
const documentoWeb = (w) => `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${PUENTE}<style>${w.css}</style></head><body>${w.html}<script>${w.js.replace(/<\/script/gi, "<\\/script")}<\/script></body></html>`;

function htmlWeb(t) {
  const w = zona(t).web;
  const tab = ["html", "css", "js"].includes(w.tab) ? w.tab : "html";
  const nombres = { html: "HTML", css: "CSS", js: "JavaScript" };
  return `<div class="segmentos zona-tabs">${Object.entries(nombres).map(([k, l]) => `<button type="button" class="segmento" aria-pressed="${tab === k}" data-accion="herr-zona-tab" data-v="${k}">${l}</button>`).join("")}</div>
    <textarea class="codigo zona-cod" id="zonaCod" data-zona="web.${tab}" spellcheck="false" rows="9" aria-label="Código ${nombres[tab]}">${esc(w[tab])}</textarea>
    <div class="fila-botones"><button class="boton principal" type="button" data-accion="herr-zona-web">${icono("play")} Ejecutar</button>
      <button class="boton" type="button" data-accion="herr-zona-reset" data-z="web">Volver al ejemplo</button></div>
    <div class="zona-web">
      <iframe id="zonaVista" class="zona-vista" title="Vista previa" sandbox="allow-scripts allow-modals" srcdoc="${esc(documentoWeb(w))}"></iframe>
      <div><small class="texto-suave">Consola (console.log)</small><pre class="salida zona-consola" id="zonaConsola" data-vacia="1">(aquí sale lo que escribas con console.log)</pre></div>
    </div>`;
}

// ---------- SQL (sql.js) ----------
const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
const BASE_EJEMPLO = `
CREATE TABLE alumnos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, apellido TEXT, grupo TEXT, edad INTEGER, ciudad TEXT);
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
let SQL = null, cargandoSql = null, db = null;
async function baseDatos() {
  if (!SQL) {
    cargandoSql ||= new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = SQLJS + "sql-wasm.js";
      s.onload = () => window.initSqlJs({ locateFile: (f) => SQLJS + f }).then(ok, mal);
      s.onerror = () => { cargandoSql = null; mal(new Error("No se ha podido cargar SQL. Revisa tu conexión.")); };
      document.head.appendChild(s);
    });
    SQL = await cargandoSql;
  }
  if (!db) { db = new SQL.Database(); db.run(BASE_EJEMPLO); }
  return db;
}
function tablaHtml(r) {
  return `<div class="tabla-scroll"><table class="tabla-herr zona-tabla"><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${r.values.map((f) => `<tr>${f.map((v) => `<td>${v === null ? "<i>NULL</i>" : esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <small class="texto-suave">${r.values.length} fila${r.values.length === 1 ? "" : "s"}</small>`;
}
async function ejecutarSql(codigo) {
  const base = await baseDatos();
  try {
    const antes = base.getRowsModified();
    const res = base.exec(codigo);
    if (res.length) return res.map(tablaHtml).join("");
    const n = base.getRowsModified() - antes;
    return `<p class="zona-ok">Hecho. ${n ? `${n} fila${n === 1 ? "" : "s"} cambiada${n === 1 ? "" : "s"}.` : "La orden se ha ejecutado."}</p>`;
  } catch (err) {
    return `<p class="zona-err">Error: ${esc(err.message)}</p>`;
  }
}
function htmlSql(t) {
  const sal = t.zonaSal?.sql;
  return `<textarea class="codigo zona-cod" id="zonaCod" data-zona="sql" spellcheck="false" rows="7" aria-label="Consulta SQL">${esc(zona(t).sql)}</textarea>
    <div class="fila-botones"><button class="boton principal" type="button" data-accion="herr-zona-sql">${icono("play")} Ejecutar</button>
      <button class="boton" type="button" data-accion="herr-zona-sql-reset">Base de datos de nuevo</button>
      <small class="texto-suave">${SQL ? "SQL listo" : "La primera vez tarda un momento en cargar"}</small></div>
    <details class="zona-esquema"><summary>Tablas de ejemplo</summary>
      <p class="mono">alumnos(id, nombre, apellido, grupo, edad, ciudad)<br>modulos(id, codigo, nombre, horas)<br>notas(alumno_id, modulo_id, nota)</p>
      <p class="texto-suave">Es SQLite: casi todo es igual que en MySQL, salvo detalles (AUTOINCREMENT en vez de AUTO_INCREMENT, no hay SHOW TABLES…). Puedes hacer CREATE, INSERT, UPDATE, DELETE; con «Base de datos de nuevo» vuelve a estar como al principio.</p></details>
    <div class="zona-sql-salida" id="zonaSalida">${sal || ""}</div>`;
}

// ---------- Python ----------
function htmlPython(t) {
  const sal = t.zonaSal?.python;
  return `<textarea class="codigo zona-cod" id="zonaCod" data-zona="python" spellcheck="false" rows="9" aria-label="Código Python">${esc(zona(t).python)}</textarea>
    <details class="entradas-py"><summary>Datos para input() (uno por línea)</summary><textarea id="zonaEntradas" rows="3" class="codigo"></textarea></details>
    <div class="fila-botones"><button class="boton principal" type="button" data-accion="herr-zona-py">${icono("play")} Ejecutar</button>
      <button class="boton" type="button" data-accion="herr-zona-reset" data-z="python">Volver al ejemplo</button>
      <a class="enlace-ver" href="#python">Plan Python ${icono("flecha")}</a></div>
    <pre class="salida ${sal?.ok === false ? "error" : ""}" id="zonaSalida">${esc(sal?.texto || "")}</pre>`;
}

// ---------- Java, C, C++, PHP ----------
function htmlOnline(t, lang) {
  const o = ONLINE[lang];
  return `<textarea class="codigo zona-cod" id="zonaCod" data-zona="${lang}" spellcheck="false" rows="10" aria-label="Código ${esc(o.nombre)}">${esc(zona(t)[lang])}</textarea>
    <div class="fila-botones"><button class="boton principal" type="button" data-accion="herr-zona-online" data-l="${lang}">${icono("play")} Copiar y abrir compilador</button>
      <button class="boton" type="button" data-accion="herr-zona-reset" data-z="${lang}">Volver al ejemplo</button></div>
    <p class="nota-pie">${esc(o.nombre)} hay que compilarlo y el navegador no puede hacerlo solo. El botón copia tu código y abre OnlineGDB (gratis, sin cuenta): borra lo que haya, pega (Ctrl+V o mantener pulsado → Pegar) y pulsa <b>Run</b>. Lo que escribas aquí se queda guardado.</p>`;
}

// ---------- Panel ----------
export function htmlZona(e, lang) {
  const t = (e.herr ||= {});
  herrActual = t;
  const tipo = TIPO_ZONA[lang];
  if (!tipo) return "";
  const titulos = { web: "Zona de pruebas: HTML + CSS + JavaScript", python: "Zona de pruebas: Python", sql: "Zona de pruebas: SQL", linux: lang === "git" ? "Terminal para practicar git" : "Terminal Linux para practicar", windows: "Consola de Windows para practicar", online: `Zona de pruebas: ${ONLINE[lang]?.nombre || ""}` };
  const pistas = {
    linux: lang === "git" ? "Prueba: <code>mkdir proyecto</code> → <code>cd proyecto</code> → <code>git init</code> → <code>echo hola > a.txt</code> → <code>git add .</code> → <code>git commit -m \"primero\"</code> → <code>git log</code>" : "Escribe comandos de uno en uno. <code>help</code> te dice cuáles funcionan.",
    windows: "Funcionan órdenes de CMD (<code>dir</code>, <code>ipconfig</code>) y de PowerShell (<code>Get-ChildItem</code>). <code>help</code> te dice cuáles.",
  };
  let cuerpo;
  if (tipo === "web") cuerpo = htmlWeb(t);
  else if (tipo === "python") cuerpo = htmlPython(t);
  else if (tipo === "sql") cuerpo = htmlSql(t);
  else if (tipo === "online") cuerpo = htmlOnline(t, lang);
  else cuerpo = `${htmlConsola(e, tipo)}<p class="texto-suave">${pistas[tipo]} Es una simulación: no toca tu ordenador. <a class="enlace-ver" href="#herramientas/terminal">Retos ${icono("flecha")}</a></p>`;
  return `<section class="zona" id="zona"><div class="panel-titulo"><h3>${icono("terminal")} ${esc(titulos[tipo])}</h3>
      ${["linux", "windows"].includes(tipo) ? `<button type="button" class="enlace-ver" data-accion="herr-term-reset" data-so="${tipo}">Empezar de cero</button>` : ""}</div>${cuerpo}</section>`;
}

// «Probar» en un trozo de código: lo lleva a la zona de pruebas
export function cargarEnZona(t, lang, codigo) {
  const z = zona(t);
  const tipo = TIPO_ZONA[lang];
  if (tipo === "web") {
    const tab = lang === "css" ? "css" : lang === "javascript" ? "js" : "html";
    if (tab === "html" && /<(style|script)\b/i.test(codigo) && /<html|<!DOCTYPE/i.test(codigo)) z.web = { html: codigo, css: "", js: "", tab };
    else z.web[tab] = codigo;
    z.web.tab = tab;
  } else if (tipo === "linux" || tipo === "windows") (t.termPre ||= {})[tipo] = codigo.split("\n")[0];
  else z[tipo === "online" ? lang : tipo] = codigo;
  (t.zonaSal ||= {})[tipo === "online" ? lang : tipo] = null;
}
// Solo se puede «Probar» lo que tiene sentido ejecutar
export const sePuedeProbar = (lang, codigo) => {
  const tipo = TIPO_ZONA[lang];
  if (!tipo) return false;
  if (tipo === "linux" || tipo === "windows") return !codigo.includes("\n") && !/^#|^\w+\s*\(\)/.test(codigo);
  return true;
};

const leerEditor = (t) => {
  const el = document.getElementById("zonaCod");
  if (!el?.dataset.zona) return;
  const z = zona(t);
  const [a, b] = el.dataset.zona.split(".");
  if (b) z[a][b] = el.value; else z[a] = el.value;
};
const irAZona = () => setTimeout(() => document.getElementById("zona")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);

export const acciones = {
  "herr-zona-tab"(b, api) { const t = api.estado().herr; leerEditor(t); zona(t).web.tab = b.dataset.v; api.pintar(); },
  "herr-zona-web"(b, api) { const t = api.estado().herr; leerEditor(t); api.pintar(); },
  "herr-zona-reset"(b, api) {
    const t = api.estado().herr; const z = zona(t); const k = b.dataset.z;
    if (k === "web") z.web = { ...WEB_INICIO, tab: z.web.tab };
    else if (k === "python") z.python = PY_INICIO;
    else if (ONLINE[k]) z[k] = ONLINE[k].ej;
    (t.zonaSal ||= {})[k] = null;
    api.pintar();
  },
  async "herr-zona-py"(b, api) {
    const t = api.estado().herr; leerEditor(t);
    const out = document.getElementById("zonaSalida");
    out.textContent = "Ejecutando… (la primera vez tarda unos segundos en cargar Python)";
    b.disabled = true;
    try { (t.zonaSal ||= {}).python = await ejecutarPython(zona(t).python, document.getElementById("zonaEntradas")?.value || ""); }
    catch (err) { (t.zonaSal ||= {}).python = { ok: false, texto: err.message }; }
    api.pintar();
  },
  async "herr-zona-sql"(b, api) {
    const t = api.estado().herr; leerEditor(t);
    const out = document.getElementById("zonaSalida");
    out.innerHTML = `<p class="texto-suave">${SQL ? "Ejecutando…" : "Cargando SQL (solo la primera vez)…"}</p>`;
    b.disabled = true;
    try { (t.zonaSal ||= {}).sql = await ejecutarSql(zona(t).sql); }
    catch (err) { (t.zonaSal ||= {}).sql = `<p class="zona-err">${esc(err.message)}</p>`; }
    api.pintar();
  },
  "herr-zona-sql-reset"(b, api) { const t = api.estado().herr; db = null; zona(t).sql = SQL_INICIO; (t.zonaSal ||= {}).sql = `<p class="zona-ok">La base de datos vuelve a estar como al principio.</p>`; api.pintar(); },
  async "herr-zona-online"(b, api) {
    const t = api.estado().herr; leerEditor(t);
    const lang = b.dataset.l;
    let copiado = true;
    try { await navigator.clipboard.writeText(zona(t)[lang]); } catch { copiado = false; }
    const v = window.open(ONLINE[lang].url, "_blank");
    if (v) { try { v.opener = null; } catch {} }
    api.aviso(!v ? `Abre ${ONLINE[lang].url} y pega el código.` : copiado ? "Código copiado. En OnlineGDB: borra lo que haya, pega y pulsa Run." : "No se ha podido copiar solo: vuelve, selecciona el código y cópialo.", 7000);
  },
  "herr-zona-cargar"(b, api) {
    const t = api.estado().herr;
    const pre = document.getElementById(b.dataset.de);
    if (!pre) return;
    const lang = b.dataset.l;
    cargarEnZona(t, lang, pre.textContent);
    if (t.bib !== lang) { t.bib = lang; t.bibBuscar = ""; }
    api.pintar();
    irAZona();
    if (TIPO_ZONA[lang] === "linux" || TIPO_ZONA[lang] === "windows") setTimeout(() => document.getElementById("termIn")?.focus({ preventScroll: true }), 400);
  },
};
