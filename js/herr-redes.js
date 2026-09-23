// =============================================================
//  herr-redes.js — VLSM, ejercicios de subnetting, IPv6, DNS / IP pública
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";
import { calcularSubred } from "./herramientas.js";

const aNum = (ip) => ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
const aIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const mascara = (c) => (c === 0 ? 0 : (0xffffffff << (32 - c)) >>> 0);
const fila = (k, v, mono = true) => `<div class="res-fila"><span>${k}</span><b class="${mono ? "mono" : ""}">${esc(String(v))}</b></div>`;
const campo = (id, k, label, v, ph = "", extra = "") =>
  `<div class="campo ${extra}"><label for="${id}">${label}</label><input id="${id}" class="mono" data-herr="${k}" value="${esc(v || "")}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false"></div>`;

// ---------- VLSM ----------
export function calcularVLSM(redTxt, lineas) {
  const [ip, p] = String(redTxt).trim().split("/");
  const base = calcularSubred(`${ip}/${p}`);
  const redes = String(lineas).split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
    const m = l.match(/^(.*?)[\s:,;]+(\d+)$/) || l.match(/^()(\d+)$/);
    if (!m) throw new Error(`No entiendo la línea «${l}». Pon: nombre hosts (p. ej. Ventas 50)`);
    return { nombre: m[1].trim() || `Red ${i + 1}`, pedidos: Number(m[2]) };
  });
  if (!redes.length) return null;
  const orden = [...redes].sort((a, b) => b.pedidos - a.pedidos);
  let actual = aNum(base.red);
  const fin = aNum(base.broadcast);
  const res = [];
  for (const r of orden) {
    let bits = 2;
    while (2 ** bits - 2 < r.pedidos) bits++;
    const cidr = 32 - bits;
    if (cidr < base.cidr) throw new Error(`«${r.nombre}» necesita ${r.pedidos} hosts y no cabe en /${base.cidr}.`);
    const tam = 2 ** bits;
    if (actual % tam) actual = Math.ceil(actual / tam) * tam;
    if (actual + tam - 1 > fin) throw new Error(`No queda espacio para «${r.nombre}». La red ${base.red}/${base.cidr} se queda pequeña.`);
    res.push({ ...r, cidr, red: aIp(actual), mascara: aIp(mascara(cidr)), primero: aIp(actual + 1), ultimo: aIp(actual + tam - 2), broadcast: aIp(actual + tam - 1), hosts: tam - 2, sobran: tam - 2 - r.pedidos });
    actual += tam;
  }
  const usadas = actual - aNum(base.red);
  return { base, res, libres: base.total - usadas, siguiente: actual <= fin ? aIp(actual) : null };
}

function htmlVLSM(e) {
  const t = e.herr || {};
  let r = null, error = "";
  try { if (t.vlsmRed && t.vlsmLineas) r = calcularVLSM(t.vlsmRed, t.vlsmLineas); } catch (err) { error = err.message; }
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("red")} Calculadora VLSM</h2></div>
    <div class="rejilla-form">
      ${campo("vlRed", "vlsmRed", "Red de partida", t.vlsmRed, "192.168.1.0/24")}
      <div class="campo ancho"><label for="vlLin">Subredes (una por línea: nombre y hosts)</label>
        <textarea id="vlLin" class="mono" data-herr="vlsmLineas" rows="5" placeholder="Ventas 50&#10;Administración 25&#10;Dirección 10&#10;Enlace 2">${esc(t.vlsmLineas || "")}</textarea></div>
    </div>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    ${r ? `<div class="tabla-scroll"><table class="tabla-herr"><thead><tr><th>Subred</th><th>Hosts pedidos</th><th>Red</th><th>Máscara</th><th>Rango útil</th><th>Broadcast</th><th>Hosts</th></tr></thead><tbody>
      ${r.res.map((x) => `<tr><td>${esc(x.nombre)}</td><td>${x.pedidos}</td><td class="mono">${x.red}/${x.cidr}</td><td class="mono">${x.mascara}</td><td class="mono">${x.primero} – ${x.ultimo}</td><td class="mono">${x.broadcast}</td><td>${x.hosts} <small class="texto-suave">(+${x.sobran})</small></td></tr>`).join("")}
      </tbody></table></div>
      <p class="texto-suave">Quedan ${r.libres.toLocaleString("es-ES")} direcciones libres${r.siguiente ? `, a partir de <span class="mono">${r.siguiente}</span>` : ""}.</p>
      <details class="pasos"><summary>Cómo se hace</summary><ol>
        <li>Ordena las subredes de mayor a menor número de hosts.</li>
        <li>Para cada una busca el menor n con 2<sup>n</sup> − 2 ≥ hosts. El prefijo es 32 − n.</li>
        <li>Asígnala en la primera dirección libre que sea múltiplo de su tamaño (2<sup>n</sup>).</li>
        <li>La siguiente empieza justo después de su broadcast.</li></ol></details>`
      : `<p class="texto-suave">Escribe la red y las subredes que necesitas. Se ordenan solas de mayor a menor.</p>`}
  </section>`;
}

// ---------- Ejercicios de subnetting ----------
const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export function nuevoEjercicio(nivel = "medio") {
  const cidr = nivel === "facil" ? [24, 25, 26, 27][azar(0, 3)] : nivel === "dificil" ? azar(9, 22) : azar(20, 29);
  const priv = [() => `10.${azar(0, 255)}.${azar(0, 255)}.${azar(1, 254)}`, () => `172.${azar(16, 31)}.${azar(0, 255)}.${azar(1, 254)}`, () => `192.168.${azar(0, 255)}.${azar(1, 254)}`];
  const ip = priv[nivel === "facil" ? 2 : azar(0, 2)]();
  return { ip, cidr, conMascara: nivel !== "facil" && Math.random() < 0.4 };
}
const PREGUNTAS = [["red", "Dirección de red"], ["broadcast", "Broadcast"], ["primero", "Primer host"], ["ultimo", "Último host"], ["hosts", "Hosts utilizables"], ["mascara", "Máscara"]];

function htmlEjercicios(e) {
  const t = (e.herr ||= {});
  if (!t.ej) t.ej = nuevoEjercicio(t.ejNivel || "medio");
  const ej = t.ej;
  const sol = calcularSubred(`${ej.ip}/${ej.cidr}`);
  const enunciado = ej.conMascara ? `${ej.ip} con máscara ${sol.mascara}` : `${ej.ip}/${ej.cidr}`;
  const corregido = t.ejCorregido;
  const norm = (v) => String(v || "").trim().replace(/\s/g, "").replace(/^\//, "");
  const bien = (k) => k === "hosts" ? Number(norm(t["ej_" + k]).replace(/\./g, "")) === sol.hosts : k === "mascara" ? [sol.mascara, "/" + sol.cidr, String(sol.cidr)].includes(norm(t["ej_" + k])) || norm(t["ej_" + k]) === String(sol.cidr) : norm(t["ej_" + k]) === sol[k];
  const aciertos = corregido ? PREGUNTAS.filter(([k]) => bien(k)).length : 0;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("tarjetas")} Ejercicios de subnetting</h2>
      <span class="texto-suave">Racha: ${t.ejRacha || 0} · Hechos: ${t.ejHechos || 0}</span></div>
    <div class="fila-botones">${[["facil", "Fácil"], ["medio", "Medio"], ["dificil", "Difícil"]].map(([n, l]) => `<button type="button" class="chip" aria-pressed="${(t.ejNivel || "medio") === n}" data-accion="herr-ej-nivel" data-nivel="${n}">${l}</button>`).join("")}</div>
    <p class="enunciado-ej">Calcula para <b class="mono">${esc(enunciado)}</b>:</p>
    <div class="rejilla-form">${PREGUNTAS.map(([k, l]) => `<div class="campo"><label for="ej_${k}">${l}${corregido ? (bien(k) ? ` <span class="chip ok">Bien</span>` : ` <span class="chip mal">${esc(k === "hosts" ? sol.hosts.toLocaleString("es-ES") : k === "mascara" ? `${sol.mascara} (/${sol.cidr})` : sol[k])}</span>`) : ""}</label>
      <input id="ej_${k}" class="mono" data-herr="ej_${k}" value="${esc(t["ej_" + k] || "")}" autocomplete="off" spellcheck="false" inputmode="${k === "hosts" ? "numeric" : "decimal"}"></div>`).join("")}</div>
    <div class="fila-botones">
      ${corregido ? `<b>${aciertos}/6 correctas</b>` : `<button type="button" class="boton principal" data-accion="herr-ej-comprobar">Comprobar</button>`}
      <button type="button" class="boton" data-accion="herr-ej-otro">${corregido ? "Siguiente" : "Otro ejercicio"}</button>
      ${corregido ? `<button type="button" class="boton" data-accion="herr-ej-ver">Ver cómo se resuelve</button>` : ""}</div>
  </section>`;
}

// ---------- IPv6 ----------
export function expandirIPv6(txt) {
  let s = String(txt).trim().toLowerCase().split("/")[0].split("%")[0];
  if (!/^[0-9a-f:.]+$/.test(s) || !s.includes(":")) throw new Error("No es una dirección IPv6 válida.");
  // IPv4 incrustada al final (::ffff:192.168.1.1)
  const m4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (m4) { const n = aNum(m4[1]); s = s.replace(m4[1], `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`); }
  const partes = s.split("::");
  if (partes.length > 2) throw new Error("Solo puede haber un «::».");
  const izq = partes[0] ? partes[0].split(":") : [];
  const der = partes.length === 2 && partes[1] ? partes[1].split(":") : [];
  const faltan = 8 - izq.length - der.length;
  if (partes.length === 1 && faltan !== 0) throw new Error("Una IPv6 completa tiene 8 bloques.");
  if (faltan < (partes.length === 2 ? 1 : 0)) throw new Error("Hay demasiados bloques.");
  const bloques = [...izq, ...Array(partes.length === 2 ? faltan : 0).fill("0"), ...der];
  if (bloques.some((b) => !/^[0-9a-f]{1,4}$/.test(b))) throw new Error("Cada bloque tiene de 1 a 4 cifras hexadecimales.");
  return bloques.map((b) => b.padStart(4, "0"));
}
export function comprimirIPv6(bloques) {
  const c = bloques.map((b) => b.replace(/^0+(?=.)/, ""));
  let mejor = { i: -1, n: 0 };
  for (let i = 0; i < 8;) {
    if (c[i] !== "0") { i++; continue; }
    let j = i; while (j < 8 && c[j] === "0") j++;
    if (j - i > mejor.n && j - i >= 2) mejor = { i, n: j - i };
    i = j;
  }
  if (mejor.i < 0) return c.join(":");
  return (c.slice(0, mejor.i).join(":") + "::" + c.slice(mejor.i + mejor.n).join(":"));
}
function tipoIPv6(b) {
  const p = parseInt(b[0], 16);
  if (b.every((x) => x === "0000")) return "No especificada (::)";
  if (b.slice(0, 7).every((x) => x === "0000") && b[7] === "0001") return "Loopback (::1)";
  if (b.slice(0, 5).every((x) => x === "0000") && b[5] === "ffff") return "IPv4 mapeada";
  if ((p & 0xffc0) === 0xfe80) return "Link-local (fe80::/10) — solo en la red local";
  if ((p & 0xfe00) === 0xfc00) return "Única local (fc00::/7) — como las privadas de IPv4";
  if ((p & 0xff00) === 0xff00) return "Multicast (ff00::/8)";
  if (b[0] === "2001" && b[1] === "0db8") return "Documentación (2001:db8::/32)";
  if ((p & 0xe000) === 0x2000) return "Unicast global (2000::/3) — pública";
  return "Reservada / otra";
}
export function eui64(mac) {
  const h = String(mac).toLowerCase().replace(/[^0-9a-f]/g, "");
  if (h.length !== 12) throw new Error("La MAC tiene 12 cifras hexadecimales.");
  const b = h.match(/../g);
  b[0] = (parseInt(b[0], 16) ^ 0x02).toString(16).padStart(2, "0");
  const x = [...b.slice(0, 3), "ff", "fe", ...b.slice(3)].join("");
  return x.match(/.{4}/g);
}
function htmlIPv6(e) {
  const t = e.herr || {};
  let r = null, error = "", eui = null, errorMac = "";
  try { if (t.ipv6) { const b = expandirIPv6(t.ipv6); r = { b, corta: comprimirIPv6(b), tipo: tipoIPv6(b), pref: String(t.ipv6).split("/")[1] } } } catch (err) { error = err.message; }
  try { if (t.mac) eui = eui64(t.mac); } catch (err) { errorMac = err.message; }
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("red")} IPv6</h2></div>
    <div class="rejilla-form">${campo("v6", "ipv6", "Dirección IPv6", t.ipv6, "2001:db8:0:0:0:ff00:42:8329")}</div>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    ${r ? `<div class="resultado-red">${fila("Completa", r.b.join(":"))}${fila("Abreviada", r.corta)}${fila("Tipo", r.tipo, false)}
      ${r.pref ? fila("Prefijo", `/${r.pref} · ${128 - Number(r.pref)} bits de interfaz`, false) : ""}</div>
      <details class="pasos"><summary>Reglas para abreviar</summary><ol><li>Quita los ceros a la izquierda de cada bloque (0db8 → db8).</li>
        <li>Cambia UNA sola vez el grupo más largo de bloques 0 seguidos por «::».</li></ol></details>` : ""}
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("red")} EUI-64 (IPv6 a partir de la MAC)</h2></div>
    <div class="rejilla-form">${campo("v6mac", "mac", "MAC", t.mac, "00:1A:2B:3C:4D:5E")}</div>
    ${errorMac ? `<p class="error">${esc(errorMac)}</p>` : ""}
    ${eui ? `<div class="resultado-red">${fila("Identificador de interfaz", eui.join(":"))}${fila("Link-local", comprimirIPv6(["fe80", "0000", "0000", "0000", ...eui]))}</div>
      <p class="texto-suave">Se parte la MAC por la mitad, se mete FFFE en medio y se invierte el 7.º bit del primer byte.</p>` : ""}
  </section>`;
}

// ---------- DNS y mi IP ----------
const TIPOS_DNS = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"];
export async function consultarDNS(nombre, tipo) {
  const n = String(nombre).trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(n)) throw new Error("Escribe un dominio, por ejemplo digitechfp.com");
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(n)}&type=${tipo}`, { headers: { Accept: "application/dns-json" } });
  if (!r.ok) throw new Error("No se ha podido consultar el DNS.");
  const j = await r.json();
  const estados = { 0: "OK", 2: "Error del servidor", 3: "El dominio no existe (NXDOMAIN)" };
  return { nombre: n, tipo, estado: estados[j.Status] || `Código ${j.Status}`, respuestas: (j.Answer || []).map((a) => ({ nombre: a.name, tipo: TIPOS_DNS.find((x) => ({ A: 1, AAAA: 28, MX: 15, NS: 2, TXT: 16, CNAME: 5, SOA: 6 })[x] === a.type) || a.type, ttl: a.TTL, dato: a.data })) };
}
function htmlDNS(e) {
  const t = e.herr || {};
  const d = t.dnsRes;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("web")} Consulta DNS</h2></div>
    <form class="rejilla-form" data-form="herr-dns">
      <div class="campo"><label for="dnsN">Dominio</label><input id="dnsN" name="nombre" class="mono" value="${esc(t.dnsNombre || "")}" placeholder="google.com" autocomplete="off" spellcheck="false" required></div>
      <div class="campo"><label for="dnsT">Registro</label><select id="dnsT" name="tipo">${TIPOS_DNS.map((x) => `<option ${t.dnsTipo === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
      <div class="campo"><label>&nbsp;</label><button class="boton principal" type="submit">Consultar</button></div>
    </form>
    ${t.dnsError ? `<p class="error">${esc(t.dnsError)}</p>` : ""}
    ${d ? `<p class="texto-suave">${esc(d.nombre)} · ${d.tipo} · ${esc(d.estado)}</p>
      ${d.respuestas.length ? `<div class="tabla-scroll"><table class="tabla-herr"><thead><tr><th>Nombre</th><th>Tipo</th><th>TTL</th><th>Dato</th></tr></thead><tbody>
        ${d.respuestas.map((a) => `<tr><td class="mono">${esc(a.nombre)}</td><td>${esc(a.tipo)}</td><td>${a.ttl}</td><td class="mono">${esc(a.dato)}</td></tr>`).join("")}</tbody></table></div>`
        : `<p class="texto-suave">Sin registros de ese tipo.</p>`}` : `<p class="texto-suave">A = IPv4 · AAAA = IPv6 · MX = correo · NS = servidores DNS del dominio · TXT = texto (SPF, verificaciones) · CNAME = alias.</p>`}
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("ubicacion")} Mi IP pública</h2></div>
    <div class="fila-botones"><button class="boton" type="button" data-accion="herr-miip">Ver mi IP pública</button>
      ${t.miIp ? `<b class="mono">${esc(t.miIp)}</b>` : ""}</div>
    <p class="texto-suave">Es la IP con la que sales a internet (la del router). La de tu equipo en la red local se ve con <code>ipconfig</code> o <code>ip a</code>.</p>
  </section>`;
}

export const HERRAMIENTAS = [
  { id: "vlsm", t: "VLSM", grupo: "Redes", desc: "Divide una red por número de hosts", html: htmlVLSM },
  { id: "ejercicios", t: "Ejercicios de subnetting", grupo: "Redes", desc: "Practica y te corrige", html: htmlEjercicios },
  { id: "ipv6", t: "IPv6", grupo: "Redes", desc: "Abreviar, expandir, tipo y EUI-64", html: htmlIPv6 },
  { id: "dns", t: "DNS y mi IP", grupo: "Redes", desc: "Registros de un dominio e IP pública", html: htmlDNS, internet: true },
];

export const acciones = {
  "herr-ej-nivel"(b, api) { const t = api.estado().herr; t.ejNivel = b.dataset.nivel; acciones["herr-ej-otro"](b, api); },
  "herr-ej-comprobar"(b, api) {
    const t = api.estado().herr;
    t.ejCorregido = true;
    const sol = calcularSubred(`${t.ej.ip}/${t.ej.cidr}`);
    const norm = (v) => String(v || "").trim().replace(/\s/g, "");
    const ok = norm(t.ej_red) === sol.red && norm(t.ej_broadcast) === sol.broadcast && norm(t.ej_primero) === sol.primero && norm(t.ej_ultimo) === sol.ultimo;
    t.ejHechos = (t.ejHechos || 0) + 1;
    t.ejRacha = ok ? (t.ejRacha || 0) + 1 : 0;
    api.pintar();
  },
  "herr-ej-otro"(b, api) {
    const t = api.estado().herr;
    t.ej = nuevoEjercicio(t.ejNivel || "medio");
    t.ejCorregido = false;
    for (const [k] of PREGUNTAS) delete t["ej_" + k];
    api.pintar();
  },
  "herr-ej-ver"(b, api) { const t = api.estado().herr; t.subred = `${t.ej.ip}/${t.ej.cidr}`; t.mascara = ""; location.hash = "#herramientas/subredes"; },
  async "herr-miip"(b, api) {
    const t = api.estado().herr;
    b.disabled = true;
    try { const r = await fetch("https://api.ipify.org?format=json"); t.miIp = (await r.json()).ip; }
    catch { t.miIp = "No se ha podido consultar (¿sin internet?)"; }
    api.pintar();
  },
};
export const formularios = {
  async "herr-dns"(form, api) {
    const t = api.estado().herr;
    const f = new FormData(form);
    t.dnsNombre = f.get("nombre"); t.dnsTipo = f.get("tipo"); t.dnsError = ""; t.dnsRes = null;
    try { t.dnsRes = await consultarDNS(t.dnsNombre, t.dnsTipo); } catch (err) { t.dnsError = err.message || "No se ha podido consultar (¿sin internet?)"; }
    api.pintar();
  },
};
