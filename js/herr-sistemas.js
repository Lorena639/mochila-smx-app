// =============================================================
//  herr-sistemas.js — chmod, generador Cisco, RAID y cron
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";

const fila = (k, v, mono = true) => `<div class="res-fila"><span>${k}</span><b class="${mono ? "mono" : ""}">${esc(String(v))}</b></div>`;
const copiable = (id, texto, filas = 8) => `<div class="copiable"><textarea id="${id}" class="mono codigo" readonly rows="${filas}">${esc(texto)}</textarea>
  <button type="button" class="boton peque" data-accion="herr-copiar" data-de="${id}">Copiar</button></div>`;

// ---------- chmod ----------
export function chmodDe(octal) {
  const o = String(octal).padStart(3, "0").slice(-3);
  if (!/^[0-7]{3}$/.test(o)) return null;
  const sim = [...o].map((d) => { const n = Number(d); return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-"); }).join("");
  return { octal: o, simbolico: sim };
}
export function octalDeSimbolico(s) {
  const t = String(s).trim().replace(/^[-dl]/, "");
  if (!/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(t)) return null;
  return [0, 3, 6].map((i) => (t[i] === "r" ? 4 : 0) + (t[i + 1] === "w" ? 2 : 0) + (t[i + 2] === "x" ? 1 : 0)).join("");
}
function htmlChmod(e) {
  const t = e.herr || {};
  const r = chmodDe(t.chmod || "755") || chmodDe("755");
  const quien = [["Propietario (u)", 0], ["Grupo (g)", 1], ["Otros (o)", 2]];
  const permisos = [["r", "Leer", 4], ["w", "Escribir", 2], ["x", "Ejecutar", 1]];
  const texto = (n) => [n & 4 && "leer", n & 2 && "escribir", n & 1 && "ejecutar"].filter(Boolean).join(", ") || "nada";
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("candado")} Calculadora chmod</h2></div>
    <div class="tabla-scroll"><table class="tabla-herr chmod"><thead><tr><th></th>${permisos.map(([, l, v]) => `<th>${l} (${v})</th>`).join("")}<th>Número</th></tr></thead><tbody>
      ${quien.map(([l, i]) => { const d = Number(r.octal[i]); return `<tr><td>${l}</td>${permisos.map(([p, , v]) => `<td><button type="button" class="casilla-bit ${d & v ? "on" : ""}" data-accion="herr-chmod-bit" data-pos="${i}" data-valor="${v}" aria-pressed="${Boolean(d & v)}">${d & v ? p : "–"}</button></td>`).join("")}<td class="mono"><b>${d}</b></td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="rejilla-form">
      <div class="campo"><label for="chO">Número (octal)</label><input id="chO" class="mono" data-herr="chmod" value="${esc(t.chmod ?? r.octal)}" maxlength="4" inputmode="numeric"></div>
      <div class="campo"><label for="chS">o simbólico (rwxr-xr-x)</label><input id="chS" class="mono" data-herr="chmodSim" value="${esc(t.chmodSim || "")}" placeholder="${r.simbolico}" maxlength="10"></div>
    </div>
    <div class="resultado-red">${fila("Simbólico", "-" + r.simbolico)}${fila("Comando", `chmod ${r.octal} archivo`)}
      ${fila("Propietario", texto(Number(r.octal[0])), false)}${fila("Grupo", texto(Number(r.octal[1])), false)}${fila("Otros", texto(Number(r.octal[2])), false)}</div>
    <p class="texto-suave">Típicos: 755 carpetas y scripts · 644 archivos · 600 claves privadas · 700 carpeta personal. En carpetas, x = poder entrar.</p>
  </section>`;
}

// ---------- Generador Cisco ----------
function prefijoAMascara(p) {
  const m = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  return [24, 16, 8, 0].map((s) => (m >>> s) & 255).join(".");
}
function ipYMascara(txt) {
  const [ip, p] = String(txt).trim().split("/");
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip || "")) return null;
  const pref = Number(p);
  return { ip, mascara: p && pref >= 0 && pref <= 32 ? prefijoAMascara(pref) : "255.255.255.0", pref: p ? pref : 24 };
}
export function generarCisco(c) {
  const l = [];
  const x = (s) => l.push(s);
  x("enable"); x("configure terminal");
  if (c.hostname) x(`hostname ${c.hostname.replace(/\s+/g, "-")}`);
  x("no ip domain-lookup");
  if (c.secret) x(`enable secret ${c.secret}`);
  if (c.banner) x(`banner motd #${c.banner.replace(/#/g, "")}#`);
  if (c.consola) { x("line console 0"); x(` password ${c.consola}`); x(" login"); x(" logging synchronous"); x(" exit"); }
  if (c.ssh && c.usuario && c.clave) {
    x(`ip domain-name ${c.dominio || "smx.local"}`);
    x(`username ${c.usuario} privilege 15 secret ${c.clave}`);
    x("crypto key generate rsa general-keys modulus 2048");
    x("ip ssh version 2");
    x("line vty 0 15"); x(" transport input ssh"); x(" login local"); x(" exit");
  } else if (c.vty) { x("line vty 0 4"); x(` password ${c.vty}`); x(" login"); x(" exit"); }
  x("service password-encryption");
  const vlans = String(c.vlans || "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^(\d+)\s*(.*)$/); return m ? { id: m[1], nombre: m[2].trim().replace(/\s+/g, "_") } : null; }).filter(Boolean);
  if (c.tipo === "switch") {
    for (const v of vlans) { x(`vlan ${v.id}`); if (v.nombre) x(` name ${v.nombre}`); x(" exit"); }
    for (const a of String(c.accesos || "").split("\n").map((s) => s.trim()).filter(Boolean)) {
      const m = a.match(/^(\S+)\s+(?:vlan\s*)?(\d+)$/i);
      if (!m) continue;
      x(`interface ${m[1].includes("-") ? "range " : ""}${m[1]}`); x(" switchport mode access"); x(` switchport access vlan ${m[2]}`); x(" no shutdown"); x(" exit");
    }
    if (c.trunk) { x(`interface ${c.trunk}`); x(" switchport mode trunk"); if (vlans.length) x(` switchport trunk allowed vlan ${vlans.map((v) => v.id).join(",")}`); x(" no shutdown"); x(" exit"); }
    const g = ipYMascara(c.gestion || "");
    if (g) { x(`interface vlan ${c.vlanGestion || 1}`); x(` ip address ${g.ip} ${g.mascara}`); x(" no shutdown"); x(" exit"); }
    if (c.gateway) x(`ip default-gateway ${c.gateway}`);
  } else {
    for (const linea of String(c.interfaces || "").split("\n").map((s) => s.trim()).filter(Boolean)) {
      const [nombre, dir, ...desc] = linea.split(/\s+/);
      const d = ipYMascara(dir || "");
      if (!nombre || !d) continue;
      const sub = nombre.match(/\.(\d+)$/);
      x(`interface ${nombre}`);
      if (desc.length) x(` description ${desc.join(" ")}`);
      if (sub) x(` encapsulation dot1Q ${sub[1]}`);
      x(` ip address ${d.ip} ${d.mascara}`);
      if (c.nat && nombre === c.natFuera) x(" ip nat outside"); else if (c.nat) x(" ip nat inside");
      x(" no shutdown"); x(" exit");
    }
    const dh = ipYMascara(c.dhcpRed || "");
    if (dh) {
      const gw = c.dhcpGw || dh.ip.replace(/\d+$/, "1");
      x(`ip dhcp excluded-address ${gw} ${gw.replace(/\d+$/, (n) => String(Math.min(254, Number(n) + 9)))}`);
      x("ip dhcp pool LAN"); x(` network ${dh.ip} ${dh.mascara}`); x(` default-router ${gw}`); x(` dns-server ${c.dhcpDns || "8.8.8.8"}`); x(" exit");
    }
    if (c.rutaDefecto) x(`ip route 0.0.0.0 0.0.0.0 ${c.rutaDefecto}`);
    if (c.nat && c.natFuera) { x("access-list 1 permit any"); x(`ip nat inside source list 1 interface ${c.natFuera} overload`); }
  }
  x("end"); x("copy running-config startup-config");
  return l.join("\n");
}
function htmlCisco(e) {
  const t = (e.herr ||= {});
  const c = (t.cisco ||= { tipo: "router" });
  const inp = (k, label, ph = "", ancho = false, tipo = "input") => `<div class="campo ${ancho ? "ancho" : ""}"><label for="cs_${k}">${label}</label>${tipo === "area"
    ? `<textarea id="cs_${k}" class="mono" data-herr="cisco.${k}" rows="3" placeholder="${esc(ph)}">${esc(c[k] || "")}</textarea>`
    : `<input id="cs_${k}" class="mono" data-herr="cisco.${k}" value="${esc(c[k] || "")}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false">`}</div>`;
  const chk = (k, label) => `<label class="check"><input type="checkbox" data-herr="cisco.${k}" ${c[k] ? "checked" : ""}> ${label}</label>`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("terminal")} Generador de configuración Cisco</h2></div>
    <div class="fila-botones">${["router", "switch"].map((x) => `<button type="button" class="chip" aria-pressed="${c.tipo === x}" data-accion="herr-cisco-tipo" data-tipo="${x}">${x === "router" ? "Router" : "Switch"}</button>`).join("")}</div>
    <div class="rejilla-form">
      ${inp("hostname", "Hostname", c.tipo === "router" ? "R1" : "SW1")}${inp("secret", "enable secret", "class")}${inp("consola", "Contraseña de consola", "cisco")}
      ${inp("banner", "Banner", "Acceso solo autorizado", true)}
      <div class="campo ancho">${chk("ssh", "Acceso remoto por SSH (recomendado)")}</div>
      ${c.ssh ? `${inp("dominio", "Dominio", "smx.local")}${inp("usuario", "Usuario SSH", "admin")}${inp("clave", "Clave SSH", "")}` : inp("vty", "Contraseña Telnet (vty)", "")}
      ${c.tipo === "switch" ? `
        ${inp("vlans", "VLANs (id nombre, una por línea)", "10 ALUMNOS\n20 PROFES\n99 GESTION", true, "area")}
        ${inp("accesos", "Puertos de acceso (puerto vlan)", "f0/1-10 10\nf0/11-20 20", true, "area")}
        ${inp("trunk", "Puerto troncal", "g0/1")}${inp("gestion", "IP de gestión", "192.168.99.2/24")}${inp("vlanGestion", "VLAN de gestión", "99")}${inp("gateway", "Puerta de enlace", "192.168.99.1")}`
      : `
        ${inp("interfaces", "Interfaces (nombre ip/prefijo descripción)", "g0/0 192.168.1.1/24 LAN\ng0/1 10.0.0.2/30 Internet\ng0/0.10 192.168.10.1/24 VLAN10", true, "area")}
        ${inp("rutaDefecto", "Ruta por defecto (siguiente salto)", "10.0.0.1")}
        ${inp("dhcpRed", "DHCP: red", "192.168.1.0/24")}${inp("dhcpGw", "DHCP: puerta de enlace", "192.168.1.1")}${inp("dhcpDns", "DHCP: DNS", "8.8.8.8")}
        <div class="campo">${chk("nat", "NAT/PAT hacia internet")}</div>${c.nat ? inp("natFuera", "Interfaz hacia internet", "g0/1") : ""}`}
    </div>
    ${copiable("ciscoSalida", generarCisco(c), 16)}
    <p class="texto-suave">Pégalo en Packet Tracer (CLI) o en la consola del equipo. Revisa siempre antes de aplicar en uno real.</p>
  </section>`;
}

// ---------- RAID ----------
export function calcularRAID(n, tam) {
  const r = [];
  if (n >= 2) r.push({ nivel: "RAID 0", util: n * tam, fallos: "0 (si falla uno, se pierde todo)", min: 2, nota: "Máxima velocidad y capacidad, sin seguridad." });
  if (n >= 2) r.push({ nivel: "RAID 1", util: tam, fallos: `${n - 1}`, min: 2, nota: "Espejo: todos los discos guardan lo mismo." });
  if (n >= 3) r.push({ nivel: "RAID 5", util: (n - 1) * tam, fallos: "1", min: 3, nota: "Paridad repartida. Buen equilibrio." });
  if (n >= 4) r.push({ nivel: "RAID 6", util: (n - 2) * tam, fallos: "2", min: 4, nota: "Doble paridad. Más seguro que el 5." });
  if (n >= 4 && n % 2 === 0) r.push({ nivel: "RAID 10", util: (n / 2) * tam, fallos: `1 por espejo (hasta ${n / 2})`, min: 4, nota: "Espejos + reparto. Rápido y seguro, pierde la mitad." });
  return r;
}
function htmlRAID(e) {
  const t = e.herr || {};
  const n = Math.max(1, Math.min(32, Number(t.raidN) || 4));
  const tam = Math.max(0.001, Number(String(t.raidTam || "2").replace(",", ".")) || 2);
  const u = t.raidU || "TB";
  const lista = calcularRAID(n, tam);
  const fmt = (v) => `${Number(v.toFixed(2)).toLocaleString("es-ES")} ${u}`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("archivo")} Calculadora RAID</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="rN">Número de discos</label><input id="rN" type="number" min="1" max="32" data-herr="raidN" value="${esc(t.raidN ?? "4")}"></div>
      <div class="campo"><label for="rT">Tamaño de cada disco</label><input id="rT" inputmode="decimal" data-herr="raidTam" value="${esc(t.raidTam ?? "2")}"></div>
      <div class="campo"><label for="rU">Unidad</label><select id="rU" data-herr="raidU">${["GB", "TB"].map((x) => `<option ${u === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    </div>
    <p class="texto-suave">Total bruto: ${fmt(n * tam)}</p>
    ${lista.length ? `<div class="tabla-scroll"><table class="tabla-herr"><thead><tr><th>Nivel</th><th>Espacio útil</th><th>%</th><th>Discos que pueden fallar</th><th></th></tr></thead><tbody>
      ${lista.map((r) => `<tr><td><b>${r.nivel}</b></td><td>${fmt(r.util)}</td><td>${Math.round((r.util / (n * tam)) * 100)} %</td><td>${esc(r.fallos)}</td><td class="texto-suave">${esc(r.nota)}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="texto-suave">Con 1 disco no hay RAID.</p>`}
    <p class="nota-pie">RAID no es una copia de seguridad: si borras un archivo, se borra en todos los discos.</p>
  </section>`;
}

// ---------- cron ----------
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function campoCron(v, nombre, lista = null, min = 0, max = 59) {
  const nom = (n) => (lista ? lista[Number(n)] ?? n : n);
  if (v === "*") return null;
  let m;
  if ((m = v.match(/^\*\/(\d+)$/))) return `cada ${m[1]} ${nombre.plural}`;
  let rangos = 0;
  const partes = v.split(",").map((p) => {
    const r = p.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (r) { if (Number(r[1]) < min || Number(r[2]) > max) throw new Error(); rangos++; return `de ${nom(r[1])} a ${nom(r[2])}${r[3] ? ` cada ${r[3]}` : ""}`; }
    if (!/^\d+$/.test(p) || Number(p) < min || Number(p) > max) throw new Error();
    return nom(p);
  });
  // "de lunes a viernes" no lleva "los" delante
  return rangos === partes.length ? partes.join(", ") : `${nombre.pre} ${partes.join(", ")}`;
}
export function explicarCron(expr) {
  const alias = { "@reboot": "Al arrancar el sistema", "@hourly": "0 * * * *", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@weekly": "0 0 * * 0", "@monthly": "0 0 1 * *", "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *" };
  let s = String(expr).trim().replace(/\s+/g, " ");
  if (s === "@reboot") return alias[s];
  if (alias[s]) s = alias[s];
  const c = s.split(" ");
  if (c.length < 5) throw new Error("Una línea de cron tiene 5 campos: minuto hora día mes día-de-la-semana.");
  const [mi, h, dm, me, dw] = c;
  try {
    const trozos = [];
    if (/^\d+$/.test(mi) && /^\d+$/.test(h)) trozos.push(`a las ${h.padStart(2, "0")}:${mi.padStart(2, "0")}`);
    else {
      const a = campoCron(mi, { pre: "en el minuto", plural: "minutos" }, null, 0, 59);
      const b = campoCron(h, { pre: "a la(s) hora(s)", plural: "horas" }, null, 0, 23);
      trozos.push(a || "cada minuto");
      if (b) trozos.push(b);
    }
    const d1 = campoCron(dm, { pre: "el día", plural: "días" }, null, 1, 31);
    const d2 = campoCron(me, { pre: "en", plural: "meses" }, MESES, 1, 12);
    const d3 = campoCron(dw.replace(/\b7\b/g, "0"), { pre: "los", plural: "días de la semana" }, DIAS, 0, 6);
    if (d1) trozos.push(d1); if (d2) trozos.push(d2); if (d3) trozos.push(d3);
    if (!d1 && !d2 && !d3) trozos.push("todos los días");
    const txt = trozos.join(", ");
    return txt[0].toUpperCase() + txt.slice(1);
  } catch { throw new Error("Algún campo no es válido. Rangos: minuto 0-59, hora 0-23, día 1-31, mes 1-12, día semana 0-6 (0 = domingo)."); }
}
function construirCron(t) {
  const [hh, mm] = String(t.cronHora || "03:00").split(":").map((x) => String(Number(x) || 0));
  switch (t.cronFrec || "diario") {
    case "minutos": return `*/${Math.max(1, Number(t.cronN) || 5)} * * * *`;
    case "horas": return `${mm} */${Math.max(1, Number(t.cronN) || 1)} * * *`;
    case "semanal": return `${mm} ${hh} * * ${t.cronDia ?? "1"}`;
    case "laborables": return `${mm} ${hh} * * 1-5`;
    case "mensual": return `${mm} ${hh} ${Math.min(31, Math.max(1, Number(t.cronN) || 1))} * *`;
    default: return `${mm} ${hh} * * *`;
  }
}
function htmlCron(e) {
  const t = e.herr || {};
  const f = t.cronFrec || "diario";
  const linea = `${construirCron(t)} ${t.cronCmd || "/home/usuario/copia.sh"}`;
  let exp = "", error = "";
  try { if (t.cronExpr) exp = explicarCron(t.cronExpr); } catch (err) { error = err.message; }
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("reloj")} Crear una tarea cron</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="cF">Cuándo</label><select id="cF" data-herr="cronFrec">${[["minutos", "Cada X minutos"], ["horas", "Cada X horas"], ["diario", "Todos los días"], ["laborables", "De lunes a viernes"], ["semanal", "Una vez por semana"], ["mensual", "Una vez al mes"]].map(([v, l]) => `<option value="${v}" ${f === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      ${["minutos", "horas", "mensual"].includes(f) ? `<div class="campo"><label for="cN">${f === "mensual" ? "Día del mes" : f === "horas" ? "Cada cuántas horas" : "Cada cuántos minutos"}</label><input id="cN" type="number" min="1" data-herr="cronN" value="${esc(t.cronN || "")}"></div>` : ""}
      ${["diario", "laborables", "semanal", "mensual"].includes(f) ? `<div class="campo"><label for="cH">Hora</label><input id="cH" type="time" data-herr="cronHora" value="${esc(t.cronHora || "03:00")}"></div>` : ""}
      ${f === "semanal" ? `<div class="campo"><label for="cD">Día</label><select id="cD" data-herr="cronDia">${DIAS.map((d, i) => `<option value="${i}" ${String(t.cronDia ?? "1") === String(i) ? "selected" : ""}>${d}</option>`).join("")}</select></div>` : ""}
      <div class="campo ancho"><label for="cC">Comando o script</label><input id="cC" class="mono" data-herr="cronCmd" value="${esc(t.cronCmd || "")}" placeholder="/home/usuario/copia.sh"></div>
    </div>
    ${copiable("cronSalida", linea, 1)}
    <p class="texto-suave">${esc(explicarCron(linea))}. Ábrelo con <code>crontab -e</code> y pega la línea al final.</p>
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("pregunta")} Entender una línea de cron</h2></div>
    <div class="rejilla-form"><div class="campo ancho"><label for="cE">Expresión</label><input id="cE" class="mono" data-herr="cronExpr" value="${esc(t.cronExpr || "")}" placeholder="30 2 * * 1-5"></div></div>
    ${error ? `<p class="error">${esc(error)}</p>` : exp ? `<p><b>${esc(exp)}</b></p>` : ""}
    <pre class="salida-suave">┌──── minuto (0-59)\n│ ┌──── hora (0-23)\n│ │ ┌──── día del mes (1-31)\n│ │ │ ┌──── mes (1-12)\n│ │ │ │ ┌──── día de la semana (0-6, 0 = domingo)\n* * * * *  comando</pre>
  </section>`;
}

export const HERRAMIENTAS = [
  { id: "chmod", t: "chmod", grupo: "Sistemas", desc: "Permisos Linux: casillas ↔ número", html: htmlChmod },
  { id: "cisco", t: "Generador Cisco", grupo: "Sistemas", desc: "Configuración de router o switch", html: htmlCisco },
  { id: "raid", t: "RAID", grupo: "Sistemas", desc: "Espacio útil y tolerancia a fallos", html: htmlRAID },
  { id: "cron", t: "cron", grupo: "Sistemas", desc: "Programar tareas en Linux", html: htmlCron },
];

export const acciones = {
  "herr-chmod-bit"(b, api) {
    const t = api.estado().herr;
    const o = [...(chmodDe(t.chmod || "755") || chmodDe("755")).octal].map(Number);
    o[Number(b.dataset.pos)] ^= Number(b.dataset.valor);
    t.chmod = o.join(""); t.chmodSim = "";
    api.pintar();
  },
  "herr-cisco-tipo"(b, api) { const t = api.estado().herr; t.cisco = { ...(t.cisco || {}), tipo: b.dataset.tipo }; api.pintar(); },
  async "herr-copiar"(b, api) {
    const el = document.getElementById(b.dataset.de);
    const v = el?.value ?? el?.textContent ?? "";
    try { await navigator.clipboard.writeText(v); api.aviso("Copiado"); } catch { el?.select?.(); api.aviso("Selecciónalo y copia con Ctrl+C"); }
  },
};

// Campos especiales: "cisco.x" y el simbólico de chmod
export function alEscribir(t, k, v) {
  if (k.startsWith("cisco.")) { t.cisco ||= { tipo: "router" }; t.cisco[k.slice(6)] = v; return true; }
  if (k === "chmodSim") { t.chmodSim = v; const o = octalDeSimbolico(v); if (o) t.chmod = o; return true; }
  return false;
}
