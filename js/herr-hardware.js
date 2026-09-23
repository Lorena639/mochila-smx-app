// =============================================================
//  herr-hardware.js — Cableado RJ45, transferencia y unidades,
//  calculadora de SAI y presupuesto de PC
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";

const fila = (k, v, mono = false) => `<div class="res-fila"><span>${k}</span><b class="${mono ? "mono" : ""}">${esc(String(v))}</b></div>`;
const num = (v, def = 0) => { const n = Number(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : def; };
const es = (n, d = 2) => Number(n.toFixed(d)).toLocaleString("es-ES");

// ---------- RJ45 ----------
const COLORES = {
  bn: ["Blanco-naranja", "#F28C28", true], n: ["Naranja", "#F28C28", false], bv: ["Blanco-verde", "#2E9E4F", true], v: ["Verde", "#2E9E4F", false],
  ba: ["Blanco-azul", "#2D6CDF", true], a: ["Azul", "#2D6CDF", false], bm: ["Blanco-marrón", "#8B5A2B", true], m: ["Marrón", "#8B5A2B", false],
};
export const T568 = { B: ["bn", "n", "bv", "a", "ba", "v", "bm", "m"], A: ["bv", "v", "bn", "a", "ba", "n", "bm", "m"] };
const USO = ["TX+", "TX−", "RX+", "(PoE / 1 Gb)", "(PoE / 1 Gb)", "RX−", "(PoE / 1 Gb)", "(PoE / 1 Gb)"];
function htmlConector(norma) {
  return `<div class="rj45"><b>T568${norma}</b><div class="rj45-pines">${T568[norma].map((c, i) => {
    const [nombre, color, rayas] = COLORES[c];
    const fondo = rayas ? `repeating-linear-gradient(0deg, #fff 0 5px, ${color} 5px 10px)` : color;
    return `<div class="pin"><span class="hilo" style="background:${fondo}"></span><small>${i + 1}</small><span class="pin-nombre">${nombre}</span><span class="pin-uso">${USO[i]}</span></div>`;
  }).join("")}</div></div>`;
}
function htmlRJ45(e) {
  const t = e.herr || {};
  const a = t.rjA || "B", b = t.rjB || "B";
  const tipo = a === b ? ["Directo (straight-through)", "PC ↔ switch, router ↔ switch. Es el más usado."] : ["Cruzado (crossover)", "PC ↔ PC, switch ↔ switch (equipos iguales). Hoy casi todos tienen Auto-MDIX y da igual."];
  const sel = (k, v) => `<div class="segmentos">${["A", "B"].map((x) => `<button type="button" class="segmento" aria-pressed="${v === x}" data-accion="herr-rj" data-lado="${k}" data-v="${x}">T568${x}</button>`).join("")}</div>`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("red")} Cableado RJ45</h2></div>
    <div class="rj45-par">
      <div><p class="texto-suave">Extremo 1</p>${sel("rjA", a)}${htmlConector(a)}</div>
      <div><p class="texto-suave">Extremo 2</p>${sel("rjB", b)}${htmlConector(b)}</div>
    </div>
    <div class="resultado-red">${fila("Tipo de cable", tipo[0])}${fila("Para qué", tipo[1])}</div>
    <details class="pasos"><summary>Consejos para crimpar</summary><ol>
      <li>Pela unos 3 cm de funda y destrenza lo justo.</li><li>Ordena los hilos según la norma, con la pestaña del conector hacia abajo y los pines mirándote (pin 1 a la izquierda).</li>
      <li>Corta recto dejando ~1,3 cm y mete hasta el fondo: la funda tiene que entrar en el conector.</li><li>Crimpa y comprueba con el tester (1-1, 2-2… en directo; 1-3, 2-6 en cruzado).</li></ol></details>
    <p class="nota-pie">Categorías: Cat5e 1 Gbps · Cat6 1 Gbps (10 Gbps hasta 55 m) · Cat6a 10 Gbps a 100 m. Máximo 100 m por tramo.</p>
  </section>`;
}

// ---------- Transferencia y unidades ----------
const UNI_TAM = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 };
const UNI_VEL = { "Kbps": 1e3 / 8, "Mbps": 1e6 / 8, "Gbps": 1e9 / 8, "KB/s": 1e3, "MB/s": 1e6, "GB/s": 1e9 };
export function duracion(bytes, bytesPorSeg) {
  const s = bytes / bytesPorSeg;
  if (!isFinite(s)) return "—";
  if (s < 1) return `${es(s * 1000, 0)} ms`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = Math.round(s % 60);
  if (h > 48) return `${es(s / 86400, 1)} días`;
  return [h && `${h} h`, m && `${m} min`, `${seg} s`].filter(Boolean).join(" ");
}
function htmlTransferencia(e) {
  const t = e.herr || {};
  const tam = num(t.trTam ?? "4.7", 4.7), uT = t.trUT || "GB";
  const vel = num(t.trVel ?? "100", 100), uV = t.trUV || "Mbps";
  const bytes = tam * UNI_TAM[uT], bps = vel * UNI_VEL[uV];
  const ref = [["USB 2.0 (real ~35 MB/s)", 35e6], ["Wi-Fi 5 (~300 Mbps reales)", 300e6 / 8], ["Ethernet 1 Gbps (~110 MB/s)", 110e6], ["USB 3.0 (~300 MB/s)", 300e6], ["SSD SATA (~500 MB/s)", 500e6], ["SSD NVMe (~3000 MB/s)", 3e9]];
  const cv = num(t.uVal ?? "1", 1), cu = t.uUni || "GB";
  const base = cv * UNI_TAM[cu];
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("reloj")} Tiempo de transferencia</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="trT">Tamaño</label><input id="trT" inputmode="decimal" data-herr="trTam" value="${esc(t.trTam ?? "4.7")}"></div>
      <div class="campo"><label for="trUT">Unidad</label><select id="trUT" data-herr="trUT">${Object.keys(UNI_TAM).map((u) => `<option ${u === uT ? "selected" : ""}>${u}</option>`).join("")}</select></div>
      <div class="campo"><label for="trV">Velocidad</label><input id="trV" inputmode="decimal" data-herr="trVel" value="${esc(t.trVel ?? "100")}"></div>
      <div class="campo"><label for="trUV">Unidad</label><select id="trUV" data-herr="trUV">${Object.keys(UNI_VEL).map((u) => `<option ${u === uV ? "selected" : ""}>${u}</option>`).join("")}</select></div>
    </div>
    <div class="resultado-red">${fila("Tardará (en teoría)", duracion(bytes, bps))}${fila("Velocidad en MB/s", `${es(bps / 1e6)} MB/s`)}${fila("Velocidad en Mbps", `${es((bps * 8) / 1e6)} Mbps`)}</div>
    <div class="tabla-scroll"><table class="tabla-herr"><thead><tr><th>Con…</th><th>Tardaría</th></tr></thead><tbody>
      ${ref.map(([l, v]) => `<tr><td>${l}</td><td>${duracion(bytes, v)}</td></tr>`).join("")}</tbody></table></div>
    <p class="nota-pie">Ojo: b = bit, B = byte (8 bits). 100 Mbps = 12,5 MB/s. En la práctica, cuenta un 10-20 % menos.</p>
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("archivo")} Conversor de unidades</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="uV">Cantidad</label><input id="uV" inputmode="decimal" data-herr="uVal" value="${esc(t.uVal ?? "1")}"></div>
      <div class="campo"><label for="uU">Unidad</label><select id="uU" data-herr="uUni">${Object.keys(UNI_TAM).map((u) => `<option ${u === cu ? "selected" : ""}>${u}</option>`).join("")}</select></div>
    </div>
    <div class="resultado-red">${Object.keys(UNI_TAM).filter((u) => u !== cu).map((u) => fila(u, es(base / UNI_TAM[u], 4), true)).join("")}</div>
    <p class="nota-pie">KB, MB, GB = potencias de 1000 (lo que ponen los fabricantes). KiB, MiB, GiB = potencias de 1024 (lo que muestra Windows). Por eso un disco de 1 TB sale como ~931 GB.</p>
  </section>`;
}

// ---------- SAI ----------
export const EQUIPOS_SAI = [["PC de oficina", 150], ["PC gaming / estación", 450], ["Monitor 24\"", 30], ["Portátil", 65], ["Servidor pequeño / NAS", 120], ["Switch 24 puertos", 30], ["Router / ONT", 15], ["Punto de acceso Wi-Fi", 12], ["Impresora láser (reposo)", 60]];
const TAMS_SAI = [400, 600, 650, 800, 1000, 1200, 1500, 2000, 2200, 3000, 5000, 6000, 10000];
export function calcularSAI(lista, fp = 0.6, margen = 0.25) {
  const w = lista.reduce((s, x) => s + num(x.w) * Math.max(1, num(x.n, 1)), 0);
  const va = (w / fp) * (1 + margen);
  const recomendado = TAMS_SAI.find((x) => x >= va) || null;
  return { w, va, recomendado };
}
function htmlSAI(e) {
  const t = (e.herr ||= {});
  const lista = (t.sai ||= [{ nombre: "PC de oficina", w: 150, n: 1 }, { nombre: "Monitor 24\"", w: 30, n: 1 }, { nombre: "Router / ONT", w: 15, n: 1 }]);
  const fp = num(t.saiFp ?? "0.6", 0.6);
  const r = calcularSAI(lista, fp);
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("chispa")} Calculadora de SAI</h2></div>
    <div class="tabla-scroll"><table class="tabla-herr editable"><thead><tr><th>Equipo</th><th>Vatios (W)</th><th>Cantidad</th><th>Total</th><th></th></tr></thead><tbody>
      ${lista.map((x, i) => `<tr><td><input data-herr="sai.${i}.nombre" id="sai${i}n" value="${esc(x.nombre)}"></td><td><input data-herr="sai.${i}.w" id="sai${i}w" inputmode="decimal" value="${esc(x.w)}"></td>
        <td><input data-herr="sai.${i}.n" id="sai${i}c" type="number" min="1" value="${esc(x.n)}"></td><td>${es(num(x.w) * Math.max(1, num(x.n, 1)), 0)} W</td>
        <td><button type="button" class="boton icono peque" data-accion="herr-sai-quitar" data-i="${i}" aria-label="Quitar">${icono("cerrar")}</button></td></tr>`).join("")}
    </tbody></table></div>
    <div class="fila-botones"><select id="saiAdd" aria-label="Añadir equipo">${EQUIPOS_SAI.map(([n, w]) => `<option value="${esc(n)}|${w}">${esc(n)} (${w} W)</option>`).join("")}<option value="Otro|50">Otro</option></select>
      <button type="button" class="boton" data-accion="herr-sai-anadir">${icono("mas")} Añadir</button></div>
    <div class="rejilla-form"><div class="campo"><label for="saiFp">Factor de potencia del SAI</label><input id="saiFp" inputmode="decimal" data-herr="saiFp" value="${esc(t.saiFp ?? "0.6")}"></div></div>
    <div class="resultado-red">${fila("Consumo total", `${es(r.w, 0)} W`)}${fila("Potencia aparente (+25 % de margen)", `${es(r.va, 0)} VA`)}${fila("SAI recomendado", r.recomendado ? `${r.recomendado} VA o más` : "más de 10 000 VA")}</div>
    <p class="nota-pie">VA = W ÷ factor de potencia. Los SAI domésticos suelen tener 0,6; los buenos 0,9. Mira el consumo real en la etiqueta de la fuente o con un medidor. La autonomía depende de la batería: consúltala en la ficha del fabricante.</p>
  </section>`;
}

// ---------- Presupuesto de PC ----------
const COMPONENTES = ["Procesador (CPU)", "Placa base", "Memoria RAM", "Almacenamiento (SSD)", "Tarjeta gráfica", "Fuente de alimentación", "Caja", "Disipador", "Sistema operativo", "Monitor", "Teclado y ratón"];
function htmlPresupuesto(e) {
  const t = (e.herr ||= {});
  const lista = (t.pc ||= COMPONENTES.slice(0, 7).map((c) => ({ comp: c, modelo: "", precio: "" })));
  const base = lista.reduce((s, x) => s + num(x.precio), 0);
  const conIva = t.pcIva !== false;
  const iva = conIva ? 0 : base * 0.21;
  const total = base + iva + num(t.pcMontaje);
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("maletin")} Presupuesto de PC</h2></div>
    <div class="rejilla-form"><div class="campo ancho"><label for="pcN">Nombre del presupuesto</label><input id="pcN" data-herr="pcNombre" value="${esc(t.pcNombre || "")}" placeholder="PC ofimática para cliente"></div></div>
    <div class="tabla-scroll"><table class="tabla-herr editable"><thead><tr><th>Componente</th><th>Modelo</th><th>Precio (€)</th><th></th></tr></thead><tbody>
      ${lista.map((x, i) => `<tr><td><input id="pc${i}c" data-herr="pc.${i}.comp" value="${esc(x.comp)}" list="pcComps"></td><td><input id="pc${i}m" data-herr="pc.${i}.modelo" value="${esc(x.modelo)}" placeholder="Modelo"></td>
        <td><input id="pc${i}p" data-herr="pc.${i}.precio" inputmode="decimal" value="${esc(x.precio)}" placeholder="0"></td>
        <td><button type="button" class="boton icono peque" data-accion="herr-pc-quitar" data-i="${i}" aria-label="Quitar">${icono("cerrar")}</button></td></tr>`).join("")}
    </tbody></table></div>
    <datalist id="pcComps">${COMPONENTES.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
    <div class="fila-botones"><button type="button" class="boton" data-accion="herr-pc-anadir">${icono("mas")} Añadir línea</button>
      <label class="check"><input type="checkbox" data-herr="pcIva" ${conIva ? "checked" : ""}> Los precios ya llevan IVA</label></div>
    <div class="rejilla-form"><div class="campo"><label for="pcMo">Montaje / mano de obra (€)</label><input id="pcMo" inputmode="decimal" data-herr="pcMontaje" value="${esc(t.pcMontaje || "")}" placeholder="0"></div></div>
    <div class="resultado-red">${fila("Componentes", `${es(base)} €`)}${conIva ? "" : fila("IVA 21 %", `${es(iva)} €`)}${num(t.pcMontaje) ? fila("Montaje", `${es(num(t.pcMontaje))} €`) : ""}${fila("Total", `${es(total)} €`)}</div>
    <div class="fila-botones"><button type="button" class="boton" data-accion="herr-pc-csv">${icono("descargar")} Descargar (Excel/CSV)</button></div>
    <details class="pasos"><summary>Comprueba la compatibilidad</summary><ol>
      <li>Socket de la CPU = socket de la placa (AM5, LGA1700…).</li><li>Tipo de RAM que admite la placa (DDR4 o DDR5).</li>
      <li>Formato de placa y caja (ATX, micro-ATX, mini-ITX) y largo de la gráfica.</li><li>Potencia de la fuente: suma de consumos + 30 %.</li>
      <li>Ranuras M.2 / SATA para el almacenamiento.</li></ol></details>
    <p class="nota-pie">Se guarda solo mientras tienes la app abierta. Descárgalo para no perderlo.</p>
  </section>`;
}

export const HERRAMIENTAS = [
  { id: "rj45", t: "Cableado RJ45", grupo: "Hardware", desc: "T568A/B, directo o cruzado", html: htmlRJ45 },
  { id: "transferencia", t: "Transferencia y unidades", grupo: "Hardware", desc: "Cuánto tarda · KB vs KiB", html: htmlTransferencia },
  { id: "sai", t: "SAI", grupo: "Hardware", desc: "Qué SAI necesitas", html: htmlSAI },
  { id: "presupuesto", t: "Presupuesto de PC", grupo: "Hardware", desc: "Componentes, precios y total", html: htmlPresupuesto },
];

export const acciones = {
  "herr-rj"(b, api) { api.estado().herr[b.dataset.lado] = b.dataset.v; api.pintar(); },
  "herr-sai-anadir"(b, api) {
    const t = api.estado().herr;
    const [nombre, w] = (document.getElementById("saiAdd")?.value || "Otro|50").split("|");
    (t.sai ||= []).push({ nombre, w: Number(w), n: 1 });
    api.pintar();
  },
  "herr-sai-quitar"(b, api) { api.estado().herr.sai.splice(Number(b.dataset.i), 1); api.pintar(); },
  "herr-pc-anadir"(b, api) { const t = api.estado().herr; (t.pc ||= []).push({ comp: "", modelo: "", precio: "" }); api.pintar(); },
  "herr-pc-quitar"(b, api) { api.estado().herr.pc.splice(Number(b.dataset.i), 1); api.pintar(); },
  "herr-pc-csv"(b, api) {
    const t = api.estado().herr;
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const filas = [["Componente", "Modelo", "Precio (€)"], ...(t.pc || []).map((x) => [x.comp, x.modelo, String(num(x.precio)).replace(".", ",")])];
    const total = (t.pc || []).reduce((s, x) => s + num(x.precio), 0) * (t.pcIva !== false ? 1 : 1.21) + num(t.pcMontaje);
    if (num(t.pcMontaje)) filas.push(["Montaje", "", String(num(t.pcMontaje)).replace(".", ",")]);
    filas.push(["TOTAL", t.pcIva !== false ? "IVA incluido" : "Con IVA 21 %", total.toFixed(2).replace(".", ",")]);
    const csv = "﻿" + filas.map((f) => f.map(q).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${(t.pcNombre || "presupuesto-pc").replace(/[^\w\-áéíóúñ ]/gi, "").trim() || "presupuesto-pc"}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  },
};

// Campos de tabla: "sai.0.w", "pc.2.precio"
export function alEscribir(t, k, v) {
  const m = k.match(/^(sai|pc)\.(\d+)\.(\w+)$/);
  if (!m) return false;
  const fila = (t[m[1]] ||= [])[Number(m[2])];
  if (fila) fila[m[3]] = v;
  return true;
}
