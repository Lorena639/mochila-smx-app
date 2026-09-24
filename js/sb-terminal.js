// =============================================================
//  sb-terminal.js — Terminales del Sandbox (xterm.js)
//   · cargarXterm(): trae xterm.js solo cuando hace falta
//   · crearTerminal(): una terminal que no se pierde al repintar
//   · EditorLinea: prompt con historial, flechas, Ctrl+C, Tab…
//     (para Windows, git y Python; Linux va directo a la máquina)
// =============================================================
const XTERM = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/";
const FIT = "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js";

export function cargarScript(src) {
  return new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${src}"]`)?.dataset.cargado) return ok();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { s.dataset.cargado = "1"; ok(); };
    s.onerror = () => { s.remove(); mal(new Error("No se ha podido descargar. Revisa tu conexión.")); };
    document.head.appendChild(s);
  });
}
let cargandoXterm = null;
export function cargarXterm() {
  if (window.Terminal && window.FitAddon) return Promise.resolve();
  cargandoXterm ||= (async () => {
    if (!document.querySelector(`link[href="${XTERM}css/xterm.css"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = XTERM + "css/xterm.css";
      document.head.appendChild(l);
    }
    await cargarScript(XTERM + "lib/xterm.js");
    await cargarScript(FIT);
  })().catch((e) => { cargandoXterm = null; throw e; });
  return cargandoXterm;
}

// Colores parecidos a los de verdad
export const TEMAS = {
  linux: { background: "#0C0C0C", foreground: "#D0D0D0", cursor: "#D0D0D0", green: "#4ADE80", brightGreen: "#86EFAC", blue: "#60A5FA", brightBlue: "#93C5FD" },
  powershell: { background: "#012456", foreground: "#EEEDF0", cursor: "#FEFEFE", yellow: "#F9F1A5", red: "#E74856", brightRed: "#FF6B7A" },
  cmd: { background: "#0C0C0C", foreground: "#CCCCCC", cursor: "#CCCCCC" },
  git: { background: "#1E1E1E", foreground: "#D4D4D4", cursor: "#D4D4D4", green: "#6CC644", red: "#F14C4C", yellow: "#E5C07B", cyan: "#56B6C2" },
  python: { background: "#0B1322", foreground: "#DDE6F5", cursor: "#FFD43B", yellow: "#FFD43B", red: "#FF8A8A", blue: "#7AB6FF" },
};

// Una terminal por entorno. Su elemento se guarda y se vuelve a colocar
// cada vez que la app repinta la pantalla (así no se pierde nada).
export function crearTerminal(tema = "linux", opciones = {}) {
  const host = document.createElement("div");
  host.className = "sb-term";
  const term = new window.Terminal({
    cursorBlink: true, convertEol: false, lineHeight: 1.2, fontSize: window.innerWidth < 600 ? 12.5 : 14,
    fontFamily: '"Cascadia Mono", Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace',
    theme: TEMAS[tema] || TEMAS.linux, scrollback: 3000, allowProposedApi: false, ...opciones,
  });
  const fit = new window.FitAddon.FitAddon();
  term.loadAddon(fit);
  let abierto = false;
  const t = {
    host, term,
    ajustar(soloAbrir = false) {
      if (!host.isConnected || !host.offsetWidth) return;
      if (!abierto) { term.open(host); abierto = true; }
      else if (soloAbrir) return;
      try { fit.fit(); } catch { /* aún sin tamaño */ }
    },
  };
  return t;
}

// ---------- Editor de una línea (como bash/PowerShell) ----------
export class EditorLinea {
  constructor(term, { prompt, alEnter, completar, alCtrlC }) {
    Object.assign(this, { term, prompt, alEnter, completar, alCtrlC });
    this.buf = ""; this.pos = 0; this.hist = []; this.hi = 0; this.ocupado = false; this.guardado = "";
  }
  escribirPrompt() { this.buf = ""; this.pos = 0; this.hi = this.hist.length; this.term.write(this.prompt()); }
  redibujar() {
    this.term.write("\r\x1b[K" + this.prompt() + this.buf);
    const atras = this.buf.length - this.pos;
    if (atras > 0) this.term.write(`\x1b[${atras}D`);
  }
  insertar(txt) {
    this.buf = this.buf.slice(0, this.pos) + txt + this.buf.slice(this.pos);
    this.pos += txt.length;
    if (this.pos === this.buf.length) this.term.write(txt); else this.redibujar();
  }
  async enter() {
    const linea = this.buf;
    this.term.write("\r\n");
    if (linea.trim() && this.hist[this.hist.length - 1] !== linea) this.hist.push(linea);
    this.hist = this.hist.slice(-200);
    this.ocupado = true;
    try { await this.alEnter(linea); }
    catch (e) { this.term.write(`\x1b[31m${String(e?.message || e)}\x1b[0m\r\n`); }
    this.ocupado = false;
    this.escribirPrompt();
  }
  // Recibe lo que se teclea (o se pega)
  async datos(d) {
    if (d === "\x03") {
      if (this.alCtrlC?.()) return;
      this.term.write("^C\r\n"); this.escribirPrompt(); return;
    }
    if (this.ocupado) return;
    switch (d) {
      case "\r": return this.enter();
      case "\x7f": case "\b":
        if (this.pos > 0) { this.buf = this.buf.slice(0, this.pos - 1) + this.buf.slice(this.pos); this.pos--; this.redibujar(); }
        return;
      case "\x1b[3~": if (this.pos < this.buf.length) { this.buf = this.buf.slice(0, this.pos) + this.buf.slice(this.pos + 1); this.redibujar(); } return;
      case "\x1b[D": if (this.pos > 0) { this.pos--; this.term.write(d); } return;
      case "\x1b[C": if (this.pos < this.buf.length) { this.pos++; this.term.write(d); } return;
      case "\x1b[H": case "\x01": this.pos = 0; return this.redibujar();
      case "\x1b[F": case "\x05": this.pos = this.buf.length; return this.redibujar();
      case "\x0c": this.term.clear(); this.term.write("\x1b[2J\x1b[H"); return this.redibujar();
      case "\x15": this.buf = this.buf.slice(this.pos); this.pos = 0; return this.redibujar();
      case "\x1b[A": case "\x1b[B": {
        if (!this.hist.length) return;
        if (this.hi === this.hist.length) this.guardado = this.buf;
        this.hi = Math.max(0, Math.min(this.hist.length, this.hi + (d === "\x1b[A" ? -1 : 1)));
        this.buf = this.hi === this.hist.length ? this.guardado : this.hist[this.hi];
        this.pos = this.buf.length; return this.redibujar();
      }
      case "\t": {
        if (!this.completar) return;
        const antes = this.buf.slice(0, this.pos);
        const r = await this.completar(antes);
        if (!r) return;
        if (r.opciones?.length > 1) { this.term.write("\r\n" + r.opciones.join("  ") + "\r\n"); this.redibujar(); }
        if (r.texto) this.insertar(r.texto);
        return;
      }
    }
    if (d.startsWith("\x1b")) return; // otras teclas especiales
    // Pegar varias líneas: cada una se ejecuta
    const trozos = d.replace(/\r\n/g, "\r").replace(/\n/g, "\r").split("\r");
    for (let i = 0; i < trozos.length; i++) {
      const limpio = trozos[i].replace(/[\x00-\x1f]/g, "");
      if (limpio) this.insertar(limpio);
      if (i < trozos.length - 1) { await this.enter(); }
    }
  }
}

// Escribe varias líneas con saltos de línea de terminal
export const lineas = (arr) => arr.map((l) => String(l).replace(/\r?\n/g, "\r\n")).join("\r\n") + (arr.length ? "\r\n" : "");

// Teclas que faltan en el teclado del móvil
export const TECLAS_MOVIL = [
  ["Tab", "\t"], ["Ctrl+C", "\x03"], ["Esc", "\x1b"], ["↑", "\x1b[A"], ["↓", "\x1b[B"], ["←", "\x1b[D"], ["→", "\x1b[C"],
  ["|", "|"], ["/", "/"], ["\\", "\\"], ["-", "-"], ["~", "~"], [">", ">"], ["$", "$"],
];
