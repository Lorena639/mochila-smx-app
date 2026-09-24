// =============================================================
//  sb-python.js — Consola de Python DE VERDAD (>>>)
//  Es CPython 3.12 compilado para el navegador (Pyodide).
// =============================================================
import { crearTerminal, EditorLinea } from "./sb-terminal.js";
import { cargarPyodide } from "./python.js";

export const python = {
  t: null, ed: null, con: null, esperar: null, repr: null,
  async iniciar() {
    if (this.t) return;
    this.t = crearTerminal("python");
    const term = this.t.term;
    let ps = ">>> ";
    this.ed = new EditorLinea(term, {
      prompt: () => ps,
      alEnter: (l) => this.ejecutar(l, (p) => { ps = p; }),
      completar: async (antes) => {
        if (!this.con) return null;
        const [lista, inicio] = this.con.complete(antes).toJs();
        const trozo = antes.slice(inicio);
        if (lista.length === 1) return { texto: lista[0].slice(trozo.length) };
        if (lista.length > 1) return { opciones: lista.slice(0, 40) };
        return null;
      },
      alCtrlC: () => { this.con?.buffer.clear(); ps = ">>> "; return false; },
    });
    term.onData((d) => this.ed.datos(d));
    term.write("Cargando Python… (la primera vez tarda unos segundos)");
    try {
      const py = await cargarPyodide();
      const { repr_shorten, PyodideConsole } = py.pyimport("pyodide.console");
      this.repr = repr_shorten;
      this.con = PyodideConsole(py.globals);
      this.esperar = py.runPython(`
import builtins
from pyodide.ffi import to_js
async def _esperar(fut):
    res = await fut
    if res is not None:
        builtins._ = res
    return to_js([res], depth=1)
_esperar`);
      this.con.stdout_callback = (s) => term.write(s.replace(/\n/g, "\r\n"));
      this.con.stderr_callback = (s) => term.write("\x1b[91m" + s.replace(/\n/g, "\r\n") + "\x1b[0m");
      py.setStdin({ stdin: () => window.prompt("input():") ?? "" });
      term.write(`\r\x1b[K\x1b[1mPython ${py.runPython("import sys; sys.version.split()[0]")}\x1b[0m (Pyodide ${py.version}) en tu navegador — es Python de verdad.\r\nEscribe código y pulsa Intro. Para bloques (for, if, def) acaba con una línea vacía.\r\n`);
      this.ed.escribirPrompt();
    } catch (e) {
      term.write(`\r\n\x1b[91m${e.message}\x1b[0m\r\n`);
      this.t = null;
    }
  },
  enviar(d) { this.ed?.datos(d); },
  async ejecutar(linea, ponerPrompt) {
    if (!this.con) return;
    const term = this.t.term;
    const fut = this.con.push(linea);
    ponerPrompt(fut.syntax_check === "incomplete" ? "... " : ">>> ");
    if (fut.syntax_check === "syntax-error") { term.write("\x1b[91m" + fut.formatted_error.trimEnd().replace(/\n/g, "\r\n") + "\x1b[0m\r\n"); fut.destroy(); return; }
    if (fut.syntax_check === "incomplete") { fut.destroy(); return; }
    const envuelto = this.esperar(fut);
    try {
      const [valor] = await envuelto;
      if (valor !== undefined) term.write(this.repr.callKwargs(valor, { separator: "\n<salida recortada>\n" }).replace(/\n/g, "\r\n") + "\r\n");
      if (valor?.destroy) valor.destroy();
    } catch (e) {
      term.write("\x1b[91m" + (fut.formatted_error || e.message).trimEnd().replace(/\n/g, "\r\n") + "\x1b[0m\r\n");
    } finally { fut.destroy(); envuelto.destroy?.(); }
  },
};
