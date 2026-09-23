// =============================================================
//  herr-seguridad.js — Contraseñas, hash, Base64/URL/hex y regex
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";

const fila = (k, v, mono = true) => `<div class="res-fila"><span>${k}</span><b class="${mono ? "mono" : ""}" style="word-break:break-all">${esc(String(v))}</b></div>`;

// ---------- Contraseñas ----------
const CONJ = { min: "abcdefghijkmnopqrstuvwxyz", may: "ABCDEFGHJKLMNPQRSTUVWXYZ", num: "23456789", sim: "!@#$%&*?-_=+.:;" };
const CONJ_TODOS = { min: "abcdefghijklmnopqrstuvwxyz", may: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", num: "0123456789", sim: "!@#$%&*?-_=+.:;" };
const PALABRAS = "casa,perro,luna,rojo,mesa,cable,router,nube,verde,tigre,playa,libro,fuego,piedra,rio,monte,trigo,azul,faro,gato,pan,sol,flor,barco,tren,lapiz,raton,teclado,puerto,torre,campo,noche,dia,viento,hoja,arena,cielo,nieve,lago,bosque".split(",");
const azar = (n) => { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
export function generarPassword({ largo = 16, min = true, may = true, num = true, sim = true, parecidos = false } = {}) {
  const fuente = parecidos ? CONJ_TODOS : CONJ;
  const grupos = [min && fuente.min, may && fuente.may, num && fuente.num, sim && fuente.sim].filter(Boolean);
  if (!grupos.length) return "";
  const todo = grupos.join("");
  const r = grupos.map((g) => g[azar(g.length)]);
  while (r.length < largo) r.push(todo[azar(todo.length)]);
  for (let i = r.length - 1; i > 0; i--) { const j = azar(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
  return r.slice(0, largo).join("");
}
export const generarFrase = (n = 4) => Array.from({ length: n }, () => PALABRAS[azar(PALABRAS.length)]).join("-") + "-" + (azar(90) + 10);
export function fortaleza(p) {
  if (!p) return null;
  let pool = 0;
  if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^a-zA-Z0-9]/.test(p)) pool += 33;
  let bits = p.length * Math.log2(pool || 1);
  const avisos = [];
  if (p.length < 12) avisos.push("Usa al menos 12 caracteres.");
  if (/(.)\1\1/.test(p)) { avisos.push("Evita repetir el mismo carácter."); bits -= 10; }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(p)) { avisos.push("Evita secuencias (1234, qwer…)."); bits -= 15; }
  if (/(password|contrase|123456|qwerty|admin|lorena|digitech|smx)/i.test(p)) { avisos.push("Contiene una palabra muy común."); bits -= 25; }
  if (/^[a-z]+$/i.test(p)) avisos.push("Mezcla números o símbolos.");
  bits = Math.max(0, bits);
  const nivel = bits < 40 ? ["mal", "Muy débil"] : bits < 60 ? ["aviso", "Débil"] : bits < 80 ? ["aviso", "Aceptable"] : bits < 100 ? ["ok", "Fuerte"] : ["ok", "Muy fuerte"];
  const seg = 2 ** bits / 1e10; // 10 000 millones de intentos por segundo
  const tiempo = seg < 1 ? "al instante" : seg < 3600 ? `${Math.round(seg / 60) || 1} min` : seg < 86400 * 365 ? `${Math.round(seg / 86400) || 1} días` : seg < 1e6 * 86400 * 365 ? `${Math.round(seg / 86400 / 365).toLocaleString("es-ES")} años` : "millones de años";
  return { bits: Math.round(bits), nivel, tiempo, avisos, pct: Math.min(100, Math.round(bits)) };
}
function htmlPassword(e) {
  const t = e.herr || {};
  const o = { largo: Number(t.pwLargo) || 16, min: t.pwMin !== false, may: t.pwMay !== false, num: t.pwNum !== false, sim: t.pwSim !== false, parecidos: Boolean(t.pwParecidos) };
  if (!t.pwGen) t.pwGen = generarPassword(o);
  const f = fortaleza(t.pwProbar || "");
  const chk = (k, l, v) => `<label class="check"><input type="checkbox" data-herr="${k}" ${v ? "checked" : ""}> ${l}</label>`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("candado")} Generador de contraseñas</h2></div>
    <div class="copiable"><input id="pwSal" class="mono salida-grande" readonly value="${esc(t.pwGen)}"><button type="button" class="boton peque" data-accion="herr-copiar" data-de="pwSal">Copiar</button></div>
    <div class="rejilla-form">
      <div class="campo"><label for="pwL">Largo: ${o.largo}</label><input id="pwL" type="range" min="8" max="64" data-herr="pwLargo" value="${o.largo}"></div>
      <div class="campo ancho fila-checks">${chk("pwMin", "minúsculas", o.min)}${chk("pwMay", "MAYÚSCULAS", o.may)}${chk("pwNum", "números", o.num)}${chk("pwSim", "símbolos", o.sim)}${chk("pwParecidos", "incluir parecidos (l, 1, O, 0)", o.parecidos)}</div>
    </div>
    <div class="fila-botones"><button type="button" class="boton principal" data-accion="herr-pw-nueva">Generar otra</button>
      <button type="button" class="boton" data-accion="herr-pw-frase">Frase fácil de recordar</button></div>
    <p class="texto-suave">Se genera en tu dispositivo con el generador seguro del navegador. No se envía a ningún sitio.</p>
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("ojo")} ¿Es segura mi contraseña?</h2></div>
    <div class="rejilla-form"><div class="campo ancho"><label for="pwP">Contraseña</label><input id="pwP" type="text" class="mono" data-herr="pwProbar" value="${esc(t.pwProbar || "")}" autocomplete="off" spellcheck="false"></div></div>
    ${f ? `<div class="medidor"><span class="${f.nivel[0]}" style="width:${f.pct}%"></span></div>
      <div class="resultado-red">${fila("Nivel", f.nivel[1], false)}${fila("Entropía aprox.", `${f.bits} bits`, false)}${fila("Tiempo para romperla (fuerza bruta)", f.tiempo, false)}</div>
      ${f.avisos.length ? `<ul class="lista-avisos">${f.avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}` : `<p class="texto-suave">No se guarda ni se envía: se comprueba aquí mismo.</p>`}
  </section>`;
}

// ---------- Hash ----------
// MD5 (no viene en el navegador). Solo para comprobar descargas, no para seguridad.
function md5(bytes) {
  const K = new Uint32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
  const len = bytes.length, n = (((len + 8) >>> 6) + 1) * 16, M = new Uint32Array(n);
  for (let i = 0; i < len; i++) M[i >> 2] |= bytes[i] << ((i % 4) * 8);
  M[len >> 2] |= 0x80 << ((len % 4) * 8);
  M[n - 2] = (len * 8) >>> 0; M[n - 1] = Math.floor(len / 0x20000000);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let o = 0; o < n; o += 16) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; } else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; } else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[o + g]) >>> 0;
      A = D; D = C; C = B;
      const s = S[(i >> 4) * 4 + (i % 4)];
      B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map((x) => [0, 8, 16, 24].map((s) => ((x >>> s) & 255).toString(16).padStart(2, "0")).join("")).join("");
}
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function calcularHashes(bytes, conMd5 = true) {
  const r = {};
  if (conMd5) r.MD5 = md5(bytes);
  for (const a of ["SHA-1", "SHA-256", "SHA-512"]) r[a] = hex(await crypto.subtle.digest(a, bytes));
  return r;
}
function htmlHash(e) {
  const t = e.herr || {};
  const comp = String(t.hashComparar || "").trim().toLowerCase();
  const res = t.hashRes;
  const coincide = comp && res ? Object.entries(res).find(([, v]) => v === comp) : null;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("candado")} Hash (MD5, SHA-1, SHA-256, SHA-512)</h2></div>
    <div class="rejilla-form">
      <div class="campo ancho"><label for="hTx">Texto</label><textarea id="hTx" class="mono" rows="3" data-herr="hashTexto">${esc(t.hashTexto || "")}</textarea></div>
      <div class="campo ancho"><label>o un archivo (ISO, instalador…)</label><label class="boton">${icono("subir")} Elegir archivo<input type="file" hidden data-herr-archivo="hash"></label>
        ${t.hashArchivo ? `<small class="texto-suave">${esc(t.hashArchivo)}</small>` : ""}</div>
      <div class="campo ancho"><label for="hCmp">Hash que te dan para comprobar (opcional)</label><input id="hCmp" class="mono" data-herr="hashComparar" value="${esc(t.hashComparar || "")}" placeholder="Pega aquí el SHA-256 de la web de descarga"></div>
    </div>
    <div class="fila-botones"><button type="button" class="boton principal" data-accion="herr-hash-texto">Calcular del texto</button></div>
    ${t.hashCargando ? `<p class="texto-suave">Calculando…</p>` : ""}
    ${res ? `<div class="resultado-red una-col">${Object.entries(res).map(([k, v]) => fila(k, v)).join("")}</div>` : ""}
    ${comp && res ? (coincide ? `<p><span class="chip ok">Coincide (${coincide[0]})</span> El archivo es el original.</p>` : `<p><span class="chip mal">No coincide</span> El archivo está dañado o no es el mismo.</p>`) : ""}
    <p class="nota-pie">Todo se calcula en tu dispositivo. Archivos de hasta 1 GB (MD5 hasta 300 MB). En Linux: <code>sha256sum archivo</code> · En Windows: <code>certutil -hashfile archivo SHA256</code></p>
  </section>`;
}

// ---------- Base64 / URL / Hex ----------
const enc = new TextEncoder(), dec = new TextDecoder("utf-8", { fatal: true });
export function codificar(modo, dir, txt) {
  const s = String(txt);
  if (!s) return "";
  try {
    if (modo === "base64") {
      if (dir === "cod") return btoa(String.fromCharCode(...enc.encode(s)));
      return dec.decode(Uint8Array.from(atob(s.trim().replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
    }
    if (modo === "url") return dir === "cod" ? encodeURIComponent(s) : decodeURIComponent(s.replace(/\+/g, " "));
    if (modo === "hex") {
      if (dir === "cod") return [...enc.encode(s)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
      const h = s.replace(/0x|[\s:,-]/gi, "");
      if (!/^([0-9a-f]{2})*$/i.test(h)) throw new Error();
      return dec.decode(Uint8Array.from(h.match(/../g) || [], (x) => parseInt(x, 16)));
    }
    if (modo === "binario") {
      if (dir === "cod") return [...enc.encode(s)].map((b) => b.toString(2).padStart(8, "0")).join(" ");
      const b = s.replace(/\s/g, "");
      if (!/^([01]{8})*$/.test(b)) throw new Error();
      return dec.decode(Uint8Array.from(b.match(/.{8}/g) || [], (x) => parseInt(x, 2)));
    }
    if (modo === "html") {
      if (dir === "cod") return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const el = document.createElement("textarea"); el.innerHTML = s; return el.value;
    }
  } catch { throw new Error("El texto no es válido para decodificar en este formato."); }
  return s;
}
function htmlCodificar(e) {
  const t = e.herr || {};
  const modo = t.codModo || "base64", dir = t.codDir || "cod";
  let r = "", error = "";
  try { r = codificar(modo, dir, t.codTexto || ""); } catch (err) { error = err.message; }
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("terminal")} Codificar y decodificar</h2></div>
    <div class="fila-botones">${[["base64", "Base64"], ["url", "URL"], ["hex", "Hexadecimal"], ["binario", "Binario"], ["html", "Entidades HTML"]].map(([m, l]) => `<button type="button" class="chip" aria-pressed="${modo === m}" data-accion="herr-cod-modo" data-modo="${m}">${l}</button>`).join("")}</div>
    <div class="segmentos">${[["cod", "Codificar"], ["dec", "Decodificar"]].map(([d, l]) => `<button type="button" class="segmento" aria-pressed="${dir === d}" data-accion="herr-cod-dir" data-dir="${d}">${l}</button>`).join("")}</div>
    <div class="rejilla-form"><div class="campo ancho"><label for="codT">Entrada</label><textarea id="codT" class="mono" rows="4" data-herr="codTexto">${esc(t.codTexto || "")}</textarea></div></div>
    ${error ? `<p class="error">${esc(error)}</p>` : `<div class="copiable"><textarea id="codS" class="mono codigo" rows="4" readonly>${esc(r)}</textarea><button type="button" class="boton peque" data-accion="herr-copiar" data-de="codS">Copiar</button></div>`}
    <div class="fila-botones"><button type="button" class="boton" data-accion="herr-cod-cambiar">Usar la salida como entrada</button></div>
    <p class="nota-pie">Base64 NO es cifrado: cualquiera lo decodifica. Se usa para meter datos binarios en texto (correo, JSON, cabeceras HTTP Basic).</p>
  </section>`;
}

// ---------- Regex ----------
export function probarRegex(patron, flags, texto) {
  const f = [...new Set((flags || "") + "g")].filter((c) => "gimsuy".includes(c)).join("");
  const re = new RegExp(patron, f);
  const m = [...String(texto).matchAll(re)].filter((x) => x[0] !== "" || true).slice(0, 500);
  return { re, m };
}
function htmlRegex(e) {
  const t = e.herr || {};
  let r = null, error = "";
  try { if (t.rePatron) r = probarRegex(t.rePatron, t.reFlags ?? "i", t.reTexto || ""); } catch (err) { error = "Expresión no válida: " + err.message.replace(/^Invalid regular expression: /, ""); }
  let marcado = esc(t.reTexto || "");
  if (r && r.m.length) {
    let out = "", pos = 0;
    for (const x of r.m) { if (x[0] === "") continue; out += esc(t.reTexto.slice(pos, x.index)) + `<mark>${esc(x[0])}</mark>`; pos = x.index + x[0].length; }
    marcado = out + esc(t.reTexto.slice(pos));
  }
  const ej = [["Email", "[\\w.+-]+@[\\w-]+\\.[\\w.]+"], ["IPv4", "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b"], ["MAC", "([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}"], ["DNI", "\\b\\d{8}[A-Z]\\b"], ["Teléfono ES", "\\b[679]\\d{8}\\b"], ["URL", "https?://[^\\s]+"], ["Fecha dd/mm/aaaa", "\\b\\d{2}/\\d{2}/\\d{4}\\b"]];
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("buscar")} Probador de expresiones regulares</h2></div>
    <div class="rejilla-form">
      <div class="campo ancho"><label for="reP">Expresión</label><input id="reP" class="mono" data-herr="rePatron" value="${esc(t.rePatron || "")}" placeholder="\\b\\d{1,3}(\\.\\d{1,3}){3}\\b" spellcheck="false" autocomplete="off"></div>
      <div class="campo"><label for="reF">Opciones (flags)</label><input id="reF" class="mono" data-herr="reFlags" value="${esc(t.reFlags ?? "i")}" placeholder="gim"></div>
      <div class="campo ancho"><label for="reT">Texto de prueba</label><textarea id="reT" class="mono" rows="5" data-herr="reTexto">${esc(t.reTexto || "")}</textarea></div>
    </div>
    <div class="fila-botones"><span class="texto-suave">Ejemplos:</span>${ej.map(([l, p]) => `<button type="button" class="chip" data-accion="herr-re-ej" data-p="${esc(p)}">${l}</button>`).join("")}</div>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    ${r ? `<p><b>${r.m.filter((x) => x[0] !== "").length}</b> coincidencias</p><pre class="salida-suave regex-marcado">${marcado || "&nbsp;"}</pre>
      ${r.m.some((x) => x.length > 1) ? `<div class="tabla-scroll"><table class="tabla-herr"><thead><tr><th>#</th><th>Coincidencia</th>${r.m[0].slice(1).map((_, i) => `<th>Grupo ${i + 1}</th>`).join("")}</tr></thead><tbody>
        ${r.m.slice(0, 50).map((x, i) => `<tr><td>${i + 1}</td><td class="mono">${esc(x[0])}</td>${x.slice(1).map((g) => `<td class="mono">${esc(g ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}` : ""}
    <details class="pasos"><summary>Chuleta rápida</summary><div class="chuletas">${[[".", "Cualquier carácter"], ["\\d \\w \\s", "Dígito · letra/número/_ · espacio"], ["\\D \\W \\S", "Lo contrario"], ["[abc] [^abc] [a-z]", "Uno de · ninguno de · rango"], ["* + ?", "0 o más · 1 o más · 0 o 1"], ["{3} {2,5}", "Exactamente 3 · de 2 a 5"], ["^ $", "Inicio · fin de línea"], ["\\b", "Límite de palabra"], ["(a|b)", "Grupo con alternativa"], ["(?:...)", "Grupo sin capturar"], ["flags g i m", "Todas · sin mayúsculas · multilínea"]].map(([c, d]) => `<div class="chuleta"><code>${esc(c)}</code><span>${esc(d)}</span></div>`).join("")}</div></details>
  </section>`;
}

export const HERRAMIENTAS = [
  { id: "contrasenas", t: "Contraseñas", grupo: "Seguridad", desc: "Generar y comprobar si son seguras", html: htmlPassword },
  { id: "hash", t: "Hash", grupo: "Seguridad", desc: "MD5 / SHA de textos y archivos", html: htmlHash },
  { id: "codificar", t: "Base64, URL y hex", grupo: "Seguridad", desc: "Codificar y decodificar", html: htmlCodificar },
  { id: "regex", t: "Regex", grupo: "Seguridad", desc: "Probar expresiones regulares", html: htmlRegex },
];

export const acciones = {
  "herr-pw-nueva"(b, api) {
    const t = api.estado().herr;
    t.pwGen = generarPassword({ largo: Number(t.pwLargo) || 16, min: t.pwMin !== false, may: t.pwMay !== false, num: t.pwNum !== false, sim: t.pwSim !== false, parecidos: Boolean(t.pwParecidos) });
    api.pintar();
  },
  "herr-pw-frase"(b, api) { api.estado().herr.pwGen = generarFrase(4); api.pintar(); },
  async "herr-hash-texto"(b, api) {
    const t = api.estado().herr;
    t.hashRes = await calcularHashes(enc.encode(t.hashTexto || "")); t.hashArchivo = "";
    api.pintar();
  },
  "herr-cod-modo"(b, api) { api.estado().herr.codModo = b.dataset.modo; api.pintar(); },
  "herr-cod-dir"(b, api) { api.estado().herr.codDir = b.dataset.dir; api.pintar(); },
  "herr-cod-cambiar"(b, api) {
    const t = api.estado().herr;
    try { t.codTexto = codificar(t.codModo || "base64", t.codDir || "cod", t.codTexto || ""); t.codDir = (t.codDir || "cod") === "cod" ? "dec" : "cod"; } catch {}
    api.pintar();
  },
  "herr-re-ej"(b, api) {
    const t = api.estado().herr;
    t.rePatron = b.dataset.p;
    if (!t.reTexto) t.reTexto = "Escríbeme a lorena@ejemplo.com o llama al 612345678.\nEl servidor está en 192.168.1.10 y el router en 192.168.1.1.\nMAC: 00:1A:2B:3C:4D:5E · Web: https://www.digitechfp.com · Fecha: 21/09/2026";
    api.pintar();
  },
};

// Archivo elegido para el hash
export async function alArchivo(input, api) {
  const f = input.files?.[0];
  if (!f) return;
  const t = api.estado().herr;
  if (f.size > 1024 ** 3) { api.aviso("El archivo pasa de 1 GB: usa sha256sum o certutil.", 5000); return; }
  t.hashCargando = true; t.hashArchivo = `${f.name} · ${(f.size / 1024 / 1024).toFixed(1)} MB`; api.pintar();
  try { const bytes = new Uint8Array(await f.arrayBuffer()); t.hashRes = await calcularHashes(bytes, f.size <= 300 * 1024 ** 2); }
  catch { api.aviso("No se ha podido leer el archivo.", 5000); }
  t.hashCargando = false; api.pintar();
}
