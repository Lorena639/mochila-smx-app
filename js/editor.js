// =============================================================
//  editor.js — Editor de texto tipo Word para apuntes y trabajos
//   · Negrita, cursiva, títulos, listas, tablas, código, enlaces…
//   · Importar un .docx (se convierte con mammoth.js)
//   · Exportar a Word (.doc) o a PDF (imprimir)
//   El HTML se limpia siempre antes de guardarlo y de mostrarlo.
// =============================================================
import { esc, formato } from "./comun.js";
import { icono } from "./iconos.js";

// ---------- Limpieza de HTML (solo etiquetas seguras) ----------
const PERMITIDAS = new Set(["P", "BR", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "A", "PRE", "CODE", "BLOCKQUOTE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "HR", "SUB", "SUP", "MARK"]);
const CAMBIOS = { H1: "H2", H5: "H4", H6: "H4", DIV: "P", STRIKE: "S", DEL: "S" };
export function limpiar(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const salida = document.createElement("div");
  const copiar = (origen, destino) => {
    for (const n of origen.childNodes) {
      if (n.nodeType === 3) { destino.appendChild(document.createTextNode(n.textContent)); continue; }
      if (n.nodeType !== 1) continue;
      let tag = CAMBIOS[n.tagName] || n.tagName;
      if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "IMG", "VIDEO", "AUDIO"].includes(n.tagName)) continue;
      if (!PERMITIDAS.has(tag)) { copiar(n, destino); continue; } // se queda el texto
      const el = document.createElement(tag);
      if (tag === "A") {
        const href = n.getAttribute("href") || "";
        if (/^(https?:|mailto:)/i.test(href)) { el.setAttribute("href", href); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
      }
      if ((tag === "TD" || tag === "TH") && n.getAttribute("colspan")) el.setAttribute("colspan", String(Number(n.getAttribute("colspan")) || 1));
      copiar(n, el);
      destino.appendChild(el);
    }
  };
  copiar(doc.body.firstChild, salida);
  return salida.innerHTML;
}
export const textoPlano = (html) => new DOMParser().parseFromString(html || "", "text/html").body.textContent.replace(/\s+/g, " ").trim();

// Contenido de un elemento: HTML del editor si lo tiene; si no, el texto con formato sencillo
export const contenido = (item, campo) => (item?.[campo + "Html"] ? `<div class="texto-rico">${limpiar(item[campo + "Html"])}</div>` : formato(item?.[campo] || ""));

// ---------- Editor (para los formularios) ----------
const BOTONES = [
  ["bold", "B", "Negrita"], ["italic", "I", "Cursiva"], ["underline", "U", "Subrayado"], ["strikeThrough", "S", "Tachado"], "|",
  ["h2", "T1", "Título"], ["h3", "T2", "Subtítulo"], ["p", "¶", "Párrafo normal"], "|",
  ["insertUnorderedList", "•", "Lista"], ["insertOrderedList", "1.", "Lista numerada"], ["blockquote", "“ ”", "Cita"], "|",
  ["code", "</>", "Código en línea"], ["pre", "{ }", "Bloque de código"], ["link", "", "Enlace"], ["table", "▦", "Tabla"], "|",
  ["removeFormat", "⌫", "Quitar formato"], ["undo", "↶", "Deshacer"], ["redo", "↷", "Rehacer"],
];
export function htmlEditor(id, valorHtml) {
  return `<div class="editor" data-editor="${id}">
    <div class="editor-barra" role="toolbar" aria-label="Formato">${BOTONES.map((b) => b === "|" ? `<span class="sep"></span>`
      : `<button type="button" data-cmd="${b[0]}" title="${b[2]}" aria-label="${b[2]}">${b[0] === "link" ? icono("enlace") : esc(b[1])}</button>`).join("")}
      <span class="hueco"></span>
      <label class="editor-importar" title="Importar un documento de Word">${icono("subir")} Importar .docx<input type="file" accept=".docx" hidden data-importar-docx></label>
    </div>
    <div class="editor-area texto-rico" id="${id}" contenteditable="true" spellcheck="true">${limpiar(valorHtml) || "<p><br></p>"}</div>
  </div>`;
}

export function activarEditor(raiz) {
  raiz.querySelectorAll("[data-editor]").forEach((ed) => {
    const area = ed.querySelector(".editor-area");
    ed.querySelector(".editor-barra").addEventListener("mousedown", (ev) => { if (ev.target.closest("button")) ev.preventDefault(); });
    ed.querySelector(".editor-barra").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-cmd]");
      if (!b) return;
      area.focus();
      const c = b.dataset.cmd;
      if (["h2", "h3", "p", "pre", "blockquote"].includes(c)) document.execCommand("formatBlock", false, c);
      else if (c === "code") {
        const t = String(window.getSelection() || "");
        document.execCommand("insertHTML", false, `<code>${esc(t || "código")}</code>&nbsp;`);
      } else if (c === "link") {
        const url = prompt("Dirección del enlace (https://…)");
        if (url && /^(https?:|mailto:)/i.test(url)) document.execCommand("createLink", false, url);
      } else if (c === "table") {
        const celda = "<td><br></td>";
        document.execCommand("insertHTML", false, `<table><thead><tr><th>Columna 1</th><th>Columna 2</th><th>Columna 3</th></tr></thead><tbody><tr>${celda.repeat(3)}</tr><tr>${celda.repeat(3)}</tr></tbody></table><p><br></p>`);
      } else document.execCommand(c, false, null);
    });
    // Pegar: siempre limpio
    area.addEventListener("paste", (ev) => {
      const html = ev.clipboardData.getData("text/html");
      if (!html) return;
      ev.preventDefault();
      document.execCommand("insertHTML", false, limpiar(html));
    });
    const imp = ed.querySelector("[data-importar-docx]");
    imp.addEventListener("change", async () => {
      const f = imp.files[0];
      if (!f) return;
      try {
        const mammoth = await cargarMammoth();
        const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
        area.innerHTML = limpiar(r.value) || "<p><br></p>";
      } catch { alertaEditor(ed, "No se ha podido leer el documento."); }
      imp.value = "";
    });
  });
}
function alertaEditor(ed, t) { const p = document.createElement("p"); p.className = "error"; p.textContent = t; ed.appendChild(p); setTimeout(() => p.remove(), 4000); }

let mammothPromesa = null;
function cargarMammoth() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  mammothPromesa ||= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
    s.onload = () => ok(window.mammoth);
    s.onerror = () => { mammothPromesa = null; mal(new Error("sin conexión")); };
    document.head.appendChild(s);
  });
  return mammothPromesa;
}

// ---------- Exportar ----------
const ESTILO = `body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;max-width:760px;margin:24px auto;padding:0 16px}
  h1{font-size:20pt;margin:0 0 4px}h2{font-size:15pt;margin:18px 0 6px}h3{font-size:12.5pt}.meta{color:#555;margin:0 0 18px}
  table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:5px 8px;text-align:left}th{background:#eef2f7}
  pre{background:#f3f5f8;padding:10px;border-radius:6px;white-space:pre-wrap;font-family:Consolas,monospace;font-size:10pt}code{font-family:Consolas,monospace;background:#f3f5f8;padding:0 3px}
  blockquote{border-left:3px solid #0A84C6;margin:0;padding-left:12px;color:#444}`;
export function documentoExportable(titulo, meta, cuerpoHtml, word = false) {
  return `<html ${word ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"' : ""}><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${ESTILO}</style></head>
    <body><h1>${esc(titulo)}</h1><p class="meta">${esc(meta)}</p>${cuerpoHtml}</body></html>`;
}
export function exportarWord(titulo, meta, cuerpoHtml) {
  const url = URL.createObjectURL(new Blob(["﻿" + documentoExportable(titulo, meta, cuerpoHtml, true)], { type: "application/msword" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${titulo.replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) || "documento"}.doc`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function exportarPDF(titulo, meta, cuerpoHtml) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(documentoExportable(titulo, meta, cuerpoHtml) + "<script>setTimeout(()=>print(),300)<\/script>");
  w.document.close();
  return true;
}
