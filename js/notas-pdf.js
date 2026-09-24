// =============================================================
//  notas-pdf.js — Leer el «Certificat de qualificacions» (PDF)
//  Todo pasa en tu dispositivo: el PDF no se sube a ningún sitio
//  y solo se guardan módulos, horas y notas (nada de DNI, etc.).
// =============================================================
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/";

async function cargarPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = PDFJS + "pdf.min.js";
    s.onload = ok;
    s.onerror = () => mal(new Error("No se ha podido cargar el lector de PDF. Revisa tu conexión."));
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  return window.pdfjsLib;
}

export async function textoDePdf(archivo) {
  const pdfjs = await cargarPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    paginas.push(c.items.map((x) => x.str + (x.hasEOL ? "\n" : " ")).join(""));
  }
  return paginas.join("\n");
}

// Convierte el texto del certificado en módulos con sus RA
export function leerCertificado(texto) {
  const t = texto
    .replace(/Mòdul\s+Durada\s+Qualif\.\s+Conv\.\/Curs\s+Resultat d'aprenentatge \(RA\)\/Estada a l'empresa \(EM\)\s+Qualif\./g, " ")
    .replace(/\b\d+ de \d+\b/g, " ")
    .replace(/\s+/g, " ");
  const cab = /(?:^|\s)(\d{4}|MP[O0])\s?\.\s?(.+?)\s+(\d{2,3})\s+(PQ|\d{1,2}(?:[.,]\d+)?)(?:\s+\d[ab]\s+\d{4}\/\d{2})?\s+(?=RA1\s)/g;
  const cabeceras = [...t.matchAll(cab)];
  const modulos = [];
  cabeceras.forEach((m, k) => {
    const fin = k + 1 < cabeceras.length ? cabeceras[k + 1].index : t.search(/I, perquè consti|Lloc i data/) > 0 ? t.search(/I, perquè consti|Lloc i data/) : t.length;
    const cuerpo = t.slice(m.index + m[0].length, fin);
    const marcas = [...cuerpo.matchAll(/RA(\d+)\s+(?:\d{4}|MP[O0])_RA\d+_|EM\s+(?:\d{4}|MP[O0])_RAE/g)];
    const ras = [];
    marcas.forEach((r, i) => {
      if (!r[1]) return; // EM: estada a l'empresa (se hace en 2º)
      const trozo = cuerpo.slice(r.index + r[0].length, i + 1 < marcas.length ? marcas[i + 1].index : cuerpo.length);
      const nums = [...trozo.matchAll(/(?:^|\s)(10|\d)(?:[.,](\d+))?(?=\s|$)/g)];
      const ult = nums[nums.length - 1];
      ras.push({ id: `RA${r[1]}`, nota: ult ? Number(`${ult[1]}${ult[2] ? "." + ult[2] : ""}`) : null });
    });
    const codigo = m[1].replace("MP0", "MPO");
    modulos.push({
      codigo,
      nombre: m[2].replace(/\s*\(\s*/g, " (").replace(/\s+\)/g, ")").trim(),
      horas: Number(m[3]),
      nota: m[4] === "PQ" ? null : Number(m[4].replace(",", ".")),
      pq: m[4] === "PQ",
      estada: /EM\s+(?:\d{4}|MP[O0])_RAE/.test(cuerpo),
      ras,
    });
  });
  return modulos;
}
