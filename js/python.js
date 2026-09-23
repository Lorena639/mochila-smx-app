// =============================================================
//  python.js — Plan para aprobar Python (pendiente de 1º)
//   · Cuenta atrás al examen de pendientes (18-20 de enero)
//   · Temario con casillas y ritmo semanal
//   · Consola de Python en el navegador (Pyodide, se carga al usarla)
//   · Ejercicios guardados con tu solución
// =============================================================
import { esc, nuevoId, hoyIso, diasHasta } from "./comun.js";
import { icono } from "./iconos.js";

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const TEMARIO = [
  "Variables, tipos de datos y conversiones", "Entrada y salida: input() y print()", "Operadores aritméticos, lógicos y de comparación",
  "Condicionales: if, elif, else", "Bucles while", "Bucles for y range()", "Cadenas de texto y sus métodos",
  "Listas", "Tuplas y conjuntos", "Diccionarios", "Funciones y parámetros", "Ámbito de variables y return",
  "Módulos e import (math, random)", "Ficheros: leer y escribir", "Excepciones: try / except", "Programación orientada a objetos: clases",
];
const EJERCICIOS = [
  ["Par o impar", "Pide un número y di si es par o impar."],
  ["Tabla de multiplicar", "Muestra la tabla de multiplicar de un número del 1 al 10."],
  ["Mayor de tres", "Pide tres números y muestra el mayor sin usar max()."],
  ["Contar vocales", "Cuenta cuántas vocales tiene una frase."],
  ["Media de una lista", "Dada una lista de notas, calcula la media, la máxima y la mínima."],
  ["Agenda con diccionario", "Guarda nombres y teléfonos en un diccionario y permite buscar por nombre."],
  ["Números primos", "Escribe una función es_primo(n) y muestra los primos hasta 100."],
  ["Calculadora con funciones", "Funciones sumar, restar, multiplicar y dividir; controla la división entre 0 con try/except."],
];

export function prepararPython(d) {
  if (d.python) return false;
  d.python = {
    temario: TEMARIO.map((texto) => ({ id: nuevoId(), texto, hecho: false })),
    ejercicios: EJERCICIOS.map(([titulo, enunciado]) => ({ id: nuevoId(), titulo, enunciado, codigo: "", hecho: false })),
    borrador: 'nombre = "Lorena"\nprint(f"Hola, {nombre}")\n\nfor i in range(1, 6):\n    print(i, "x 3 =", i * 3)\n',
  };
  return true;
}

// ---------- Consola ----------
let pyodide = null;
let cargando = null;
async function cargarPyodide() {
  if (pyodide) return pyodide;
  if (!cargando) {
    cargando = new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = PYODIDE + "pyodide.js";
      s.onload = async () => { try { pyodide = await window.loadPyodide({ indexURL: PYODIDE }); ok(pyodide); } catch (e) { mal(e); } };
      s.onerror = () => mal(new Error("No se ha podido cargar Python. Revisa tu conexión."));
      document.head.appendChild(s);
    });
  }
  return cargando;
}

export async function ejecutar(codigo, entradas = "") {
  const py = await cargarPyodide();
  const salida = [];
  py.setStdout({ batched: (t) => salida.push(t) });
  py.setStderr({ batched: (t) => salida.push(t) });
  const lineas = entradas.split("\n");
  py.setStdin({ stdin: () => (lineas.length ? lineas.shift() : "") });
  try {
    await py.runPythonAsync(codigo);
    return { ok: true, texto: salida.join("\n") || "(sin salida)" };
  } catch (err) {
    const m = String(err.message || err).split("\n").filter(Boolean);
    const i = m.findLastIndex((l) => l.includes('File "<exec>"'));
    return { ok: false, texto: [...salida, (i >= 0 ? m.slice(i) : m.slice(-2)).join("\n")].join("\n") };
  }
}

// ---------- Vista ----------
export function vistaPython(e) {
  const d = e.datos;
  const p = d.python;
  if (!p) return `<div class="vacio">${e.editor ? "Preparando…" : "Todavía no hay plan de Python."}</div>`;
  const examen = d.eventos.find((x) => x.id === "of-pendents") || d.eventos.find((x) => x.asignatura === "python" && x.tipo === "Examen" && x.fecha >= hoyIso());
  const dias = examen ? diasHasta(examen.fecha) : null;
  const hechos = p.temario.filter((t) => t.hecho).length;
  const quedan = p.temario.length - hechos;
  const semanas = dias !== null ? Math.max(1, Math.floor(dias / 7)) : null;
  const ritmo = semanas ? Math.ceil(quedan / semanas) : null;
  const ej = e.pyEjercicio ? p.ejercicios.find((x) => x.id === e.pyEjercicio) : null;
  const codigo = ej ? ej.codigo || `# ${ej.titulo}\n# ${ej.enunciado}\n\n` : p.borrador;
  return `<button type="button" class="volver" data-ir="estudio">${icono("flecha-izq")} Estudiar</button>
    <header class="cabecera-seccion"><div><h1>Plan Python</h1><p>Módulo pendiente de 1º. Examen de pendientes: 18-20 de enero.</p></div></header>
    <div class="kpis">
      <div class="panel kpi"><span class="kpi-num">${dias ?? "—"}</span><span class="kpi-que">días para el examen</span></div>
      <div class="panel kpi"><span class="kpi-num">${hechos}<small>/${p.temario.length}</small></span><span class="kpi-que">temas repasados</span></div>
      <div class="panel kpi"><span class="kpi-num">${ritmo ?? "—"}</span><span class="kpi-que">temas por semana para llegar</span></div>
      <div class="panel kpi"><span class="kpi-num">${p.ejercicios.filter((x) => x.hecho).length}<small>/${p.ejercicios.length}</small></span><span class="kpi-que">ejercicios hechos</span></div>
    </div>
    <div class="rejilla-python">
      <section class="panel consola">
        <div class="panel-titulo"><h2>${icono("terminal")} ${ej ? esc(ej.titulo) : "Consola de Python"}</h2>
          ${ej ? `<button class="enlace-ver" type="button" data-accion="py-libre">Consola libre</button>` : ""}</div>
        ${ej ? `<p class="texto-suave">${esc(ej.enunciado)}</p>` : ""}
        <textarea class="codigo" id="pyCodigo" spellcheck="false" data-cambio="py-codigo" data-ej="${esc(ej?.id || "")}" rows="12">${esc(codigo)}</textarea>
        <details class="entradas-py"><summary>Datos para input() (uno por línea)</summary><textarea id="pyEntradas" rows="3" class="codigo"></textarea></details>
        <div class="fila-botones"><button class="boton principal" type="button" data-accion="py-ejecutar">${icono("play")} Ejecutar</button>
          ${ej && e.editor ? `<button class="boton" type="button" data-accion="py-hecho" data-id="${esc(ej.id)}">${ej.hecho ? "Marcar como pendiente" : "Marcar como hecho"}</button>` : ""}
          <small class="texto-suave">${pyodide ? "Python listo" : "La primera vez tarda unos segundos en cargar"}</small></div>
        <pre class="salida" id="pySalida">${esc(e.pySalida || "")}</pre>
      </section>
      <div class="columna">
        <section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Temario</h2><small class="texto-suave">${quedan} por repasar</small></div>
          <ul class="checklist">${p.temario.map((t) => `<li><label><input type="checkbox" data-cambio="py-tema" data-id="${esc(t.id)}" ${t.hecho ? "checked" : ""} ${e.editor ? "" : "disabled"}> <span>${esc(t.texto)}</span></label></li>`).join("")}</ul></section>
        <section class="panel"><div class="panel-titulo"><h2>${icono("tarjetas")} Ejercicios</h2></div>
          <ul class="lista-ejercicios">${p.ejercicios.map((x) => `<li><button type="button" class="enlace-ver ${e.pyEjercicio === x.id ? "activo" : ""}" data-accion="py-ej" data-id="${esc(x.id)}">${esc(x.titulo)}</button>
            ${x.hecho ? `<span class="chip ok">Hecho</span>` : ""}</li>`).join("")}</ul>
          ${e.editor ? `<form class="form-inline" data-form="py-ej-nuevo"><input name="titulo" required placeholder="Nuevo ejercicio"><button class="boton" type="submit">${icono("mas")}</button></form>` : ""}</section>
      </div>
    </div>`;
}

export const acciones = {
  async "py-ejecutar"(b, api) {
    const codigo = document.getElementById("pyCodigo").value;
    const entradas = document.getElementById("pyEntradas")?.value || "";
    const out = document.getElementById("pySalida");
    out.textContent = pyodide ? "Ejecutando…" : "Cargando Python (solo la primera vez)…";
    b.disabled = true;
    try {
      const r = await ejecutar(codigo, entradas);
      api.estado().pySalida = r.texto;
      out.textContent = r.texto;
      out.classList.toggle("error", !r.ok);
    } catch (err) { out.textContent = err.message; }
    b.disabled = false;
  },
  "py-ej"(b, api) { api.estado().pyEjercicio = b.dataset.id; api.estado().pySalida = ""; api.pintar(); },
  "py-libre"(b, api) { api.estado().pyEjercicio = null; api.estado().pySalida = ""; api.pintar(); },
  "py-hecho"(b, api) { const x = api.datos().python.ejercicios.find((y) => y.id === b.dataset.id); x.hecho = !x.hecho; api.cambiar(); },
};
export const cambios = {
  "py-tema"(el, api) { api.datos().python.temario.find((t) => t.id === el.dataset.id).hecho = el.checked; api.cambiar(); },
  "py-codigo"(el, api) {
    const p = api.datos().python;
    if (el.dataset.ej) p.ejercicios.find((x) => x.id === el.dataset.ej).codigo = el.value;
    else p.borrador = el.value;
    api.cambiar(false);
  },
};
export const formularios = {
  "py-ej-nuevo"(form, api) {
    const titulo = String(new FormData(form).get("titulo")).trim();
    const x = { id: nuevoId(), titulo, enunciado: "", codigo: "", hecho: false };
    api.datos().python.ejercicios.push(x);
    api.estado().pyEjercicio = x.id;
    api.cambiar();
  },
};
