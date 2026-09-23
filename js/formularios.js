// =============================================================
//  formularios.js — Ventanas para añadir y editar (solo en el panel)
//  Cada tipo de contenido tiene aquí su lista de campos.
//  Una sola función (abrirFormulario) crea la ventana para todos.
// =============================================================
import {
  TIPOS, ESTADOS, TIPOS_EVENTO, TIPOS_FORMACION, ESTADOS_FORMACION, DIAS, COLORES,
  esc, hoyIso, tamano, clasificar, formato,
} from "./comun.js";
import { htmlEditor, activarEditor, limpiar, textoPlano } from "./editor.js";
import { icono } from "./iconos.js";
import { TAMANO_MAXIMO } from "./archivos.js";
import { GRUPOS } from "./grupos.js";

// Campo "Visible para" (Familia / Profes / Amigos). Todo marcado = lo ven todos.
const VISIBLE = { k: "visible", label: "Visible para", tipo: "grupos", ancho: true, ayuda: "Desmarca un grupo para ocultárselo. Si no marcas ninguno, solo lo ves tú." };

const asignaturasOpc = (d) => [["", "Sin materia"], ...d.asignaturas.map((a) => [a.id, a.nombre])];
const lista = (arr) => arr.map((x) => [x, x]);
const AYUDA_FORMATO = "Formato: ## título · - lista · **negrita** · `código` · ```bloque de código```";

// ---------- Campos de cada tipo ----------
export const ESQUEMAS = {
  trabajos: {
    titulo: "trabajo",
    campos: (d) => [
      { k: "titulo", label: "Título", tipo: "text", req: true, ancho: true, ph: "p. ej. Práctica 3 – DHCP en Ubuntu" },
      { k: "asignatura", label: "Materia", tipo: "select", opciones: asignaturasOpc(d) },
      { k: "tipo", label: "Tipo", tipo: "select", opciones: lista(TIPOS), def: "Práctica" },
      { k: "estado", label: "Estado", tipo: "select", opciones: ESTADOS.map((e) => [e.id, e.nombre]), def: "curso" },
      { k: "fecha", label: "Fecha de entrega", tipo: "date" },
      { k: "nota", label: "Nota", tipo: "text", ph: "p. ej. 8,5" },
      { k: "enlace", label: "Enlace (GitHub, Drive…)", tipo: "url", ancho: true },
      { k: "descripcion", label: "Descripción o el propio trabajo", tipo: "rico", ancho: true },
      { k: "usoIA", label: "¿Has usado IA?", tipo: "select", opciones: [["", "Sin indicar"], ["no", "No"], ["apoyo", "Sí, como apoyo (explicaciones, repaso)"], ["parte", "Sí, en parte del trabajo"]] },
      { k: "usoIADetalle", label: "Cómo la has usado", tipo: "text", ph: "p. ej. Para entender el DNS inverso" },
      { k: "archivos", label: "Archivos del trabajo", tipo: "archivos", ancho: true },
      VISIBLE,
    ],
  },
  apuntes: {
    titulo: "apunte",
    campos: (d) => [
      { k: "titulo", label: "Título", tipo: "text", req: true, ancho: true, ph: "p. ej. Tema 2 – Servidor DNS" },
      { k: "asignatura", label: "Materia", tipo: "select", opciones: asignaturasOpc(d).slice(1), req: true },
      { k: "fecha", label: "Fecha", tipo: "date", def: hoyIso },
      { k: "texto", label: "Apuntes", tipo: "rico", ancho: true },
      { k: "enlace", label: "Enlace (opcional)", tipo: "url", ancho: true },
      { k: "archivos", label: "PDFs, presentaciones…", tipo: "archivos", ancho: true },
      VISIBLE,
    ],
  },
  posts: {
    titulo: "entrada del día a día",
    campos: () => [
      { k: "titulo", label: "Título", tipo: "text", req: true, ancho: true, ph: "p. ej. Hoy montamos nuestro primer servidor" },
      { k: "fecha", label: "Fecha", tipo: "date", def: hoyIso },
      { k: "etiquetas", label: "Etiquetas (separadas por comas)", tipo: "tags", ph: "redes, linux, curiosidades" },
      { k: "texto", label: "Qué quieres contar", tipo: "textarea", grande: true, req: true, ancho: true, ayuda: AYUDA_FORMATO },
      { k: "archivos", label: "Fotos (puedes elegir varias) u otros archivos", tipo: "archivos", ancho: true, fotosPrimero: true },
      VISIBLE,
    ],
  },
  avisos: {
    titulo: "nota de clase",
    campos: (d) => [
      { k: "texto", label: "Nota", tipo: "textarea", req: true, ancho: true, ph: "p. ej. Mañana traer el portátil cargado" },
      { k: "fecha", label: "Fecha", tipo: "date", def: hoyIso },
      { k: "asignatura", label: "Materia", tipo: "select", opciones: asignaturasOpc(d) },
      VISIBLE,
    ],
  },
  formacion: {
    titulo: "formación",
    campos: () => [
      { k: "titulo", label: "Nombre", tipo: "text", req: true, ancho: true, ph: "p. ej. CCNA 1: Introduction to Networks" },
      { k: "entidad", label: "Entidad", tipo: "text", ph: "p. ej. Cisco Networking Academy" },
      { k: "tipo", label: "Tipo", tipo: "select", opciones: lista(TIPOS_FORMACION), def: "Curso" },
      { k: "estado", label: "Estado", tipo: "select", opciones: lista(ESTADOS_FORMACION), def: "En curso" },
      { k: "inicio", label: "Inicio", tipo: "date" },
      { k: "fin", label: "Fin", tipo: "date" },
      { k: "horas", label: "Horas", tipo: "number" },
      { k: "enlace", label: "Enlace (credencial, curso…)", tipo: "url", ancho: true },
      { k: "notas", label: "Qué he aprendido", tipo: "textarea", ancho: true, ayuda: AYUDA_FORMATO },
      { k: "archivos", label: "Certificado u otros archivos", tipo: "archivos", ancho: true },
      VISIBLE,
    ],
  },
  eventos: {
    titulo: "fecha",
    campos: (d) => [
      { k: "titulo", label: "Qué es", tipo: "text", req: true, ancho: true, ph: "p. ej. Examen UF1 de Serveis" },
      { k: "fecha", label: "Fecha", tipo: "date", req: true },
      { k: "fechaFin", label: "Hasta (si dura varios días)", tipo: "date" },
      { k: "tipo", label: "Tipo", tipo: "select", opciones: lista(TIPOS_EVENTO), def: "Examen" },
      { k: "asignatura", label: "Materia", tipo: "select", opciones: asignaturasOpc(d) },
      { k: "nota", label: "Detalle", tipo: "text", ph: "p. ej. Temas 1 a 3" },
      { k: "temas", label: "Qué entra (para el modo examen)", tipo: "textarea", ancho: true, ph: "p. ej. RA1 y RA2: seguridad pasiva y copias" },
      VISIBLE,
    ],
  },
  horario: {
    titulo: "clase",
    campos: (d) => [
      { k: "dia", label: "Día", tipo: "select", opciones: DIAS.map((n, i) => [String(i + 1), n]), def: "1", numero: true },
      { k: "inicio", label: "Empieza", tipo: "time", req: true, def: "08:00" },
      { k: "fin", label: "Acaba", tipo: "time", req: true, def: "11:00" },
      { k: "asignatura", label: "Materia", tipo: "select", opciones: asignaturasOpc(d) },
      { k: "aula", label: "Aula", tipo: "text", def: "Aula 4" },
      { k: "profe", label: "Profesor/a", tipo: "text" },
    ],
  },
  asignaturas: {
    titulo: "materia",
    campos: (d) => [
      { k: "nombre", label: "Nombre", tipo: "text", req: true, ancho: true, ph: "p. ej. 0227 Serveis de xarxa" },
      { k: "profe", label: "Profesor/a", tipo: "text" },
      { k: "email", label: "Email del profe (para justificar faltas)", tipo: "email" },
      { k: "color", label: "Color", tipo: "color", def: () => COLORES[d.asignaturas.length % COLORES.length] },
      { k: "descripcion", label: "Información y teoría de la materia", tipo: "rico", ancho: true },
    ],
  },
  config: {
    titulo: "perfil",
    campos: () => [
      { k: "nombre", label: "Tu nombre", tipo: "text", req: true },
      { k: "curso", label: "Curso", tipo: "text" },
      { k: "centro", label: "Centro", tipo: "text" },
      { k: "descripcion", label: "Frase de presentación", tipo: "textarea", ancho: true },
      { k: "archivos", label: "Foto de perfil", tipo: "archivos", ancho: true, soloImagenes: true, una: true },
    ],
  },
};

// ---------- Construir un campo ----------
function htmlCampo(c, valor, base = {}) {
  const id = `f-${c.k}`;
  const req = c.req ? "required" : "";
  const ph = c.ph ? `placeholder="${esc(c.ph)}"` : "";
  let control;
  switch (c.tipo) {
    case "textarea":
      control = `<textarea id="${id}" name="${c.k}" ${req} ${ph} class="${c.grande ? "grande" : ""}">${esc(valor ?? "")}</textarea>`; break;
    case "select":
      control = `<select id="${id}" name="${c.k}" ${req}>${c.opciones.map(([v, t]) =>
        `<option value="${esc(v)}" ${String(v) === String(valor ?? "") ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`; break;
    case "tags":
      control = `<input id="${id}" name="${c.k}" ${ph} value="${esc((valor || []).join(", "))}">`; break;
    case "archivos":
      control = `<div class="adjuntos" data-adjuntos>${(valor || []).map((r) =>
        `<span class="adjunto" data-ref="${esc(r.id)}">${icono("archivo")}${esc(r.nombre)} <small>${tamano(r.tamano)}</small>
          <button type="button" class="boton fantasma peque" data-quitar-adjunto="${esc(r.id)}" aria-label="Quitar ${esc(r.nombre)}">${icono("cerrar")}</button></span>`).join("")}</div>
        <input id="${id}" name="${c.k}" type="file" ${c.una ? "" : "multiple"} ${c.soloImagenes ? 'accept="image/*"' : c.fotosPrimero ? 'accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.py"' : ""}>
        <div class="previas" data-previas></div>`; break;
    case "rico":
      control = htmlEditor(id, base[c.k + "Html"] || formato(valor || ""));
      break;
    case "grupos": {
      const marcados = Array.isArray(valor) ? valor : GRUPOS.map((g) => g.id);
      control = `<div class="casillas" id="${id}">${GRUPOS.map((g) => `<label class="casilla"><input type="checkbox" name="${c.k}" value="${g.id}" ${marcados.includes(g.id) ? "checked" : ""}><span>${esc(g.nombre)}</span></label>`).join("")}</div>`;
      break;
    }
    default:
      control = `<input id="${id}" name="${c.k}" type="${c.tipo}" ${req} ${ph} value="${esc(valor ?? "")}" ${c.tipo === "number" ? 'min="0" step="1"' : ""}>`;
  }
  return `<div class="campo ${c.ancho ? "ancho" : ""}"><label ${c.tipo === "grupos" || c.tipo === "rico" ? "" : `for="${id}"`}>${esc(c.label)}${c.req ? " *" : ""}</label>${control}
    ${c.ayuda ? `<span class="ayuda">${esc(c.ayuda)}</span>` : ""}</div>`;
}

// ---------- Abrir la ventana ----------
// Devuelve una promesa con { valores, nuevos: File[], quitados: ref[] }, { borrar: true } o null si se cancela
export function abrirFormulario(coleccion, datos, item = null, preset = {}) {
  const esquema = ESQUEMAS[coleccion];
  const campos = esquema.campos(datos);
  const base = { ...preset, ...(item || {}) };
  for (const c of campos) if (base[c.k] === undefined && c.def !== undefined) base[c.k] = typeof c.def === "function" ? c.def() : c.def;

  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.innerHTML = `<form method="dialog" class="modal-caja" novalidate>
    <header class="modal-cabecera">
      <h2>${item ? "Editar" : "Añadir"} ${esc(esquema.titulo)}</h2>
      <button type="button" class="boton fantasma" data-cancelar aria-label="Cerrar">${icono("cerrar")}</button>
    </header>
    <div class="modal-cuerpo rejilla-form">${campos.map((c) => htmlCampo(c, base[c.k], base)).join("")}
      <div class="sugerencia ancho" aria-live="polite"></div>
      <p class="error ancho" role="alert"></p>
    </div>
    <footer class="modal-pie">
      ${item && coleccion !== "config" ? `<button type="button" class="boton peligro" data-eliminar>${icono("borrar")} Borrar</button><span class="hueco"></span>` : ""}
      <button type="button" class="boton" data-cancelar>Cancelar</button>
      <button type="submit" class="boton principal">${item ? "Guardar cambios" : "Añadir"}</button>
    </footer>
  </form>`;
  document.body.appendChild(dlg);
  activarEditor(dlg);

  const quitados = [];
  const $ = (s) => dlg.querySelector(s);

  // Clasificación automática (solo trabajos): propone materia y tipo
  if (coleccion === "trabajos") {
    const tocados = new Set(item ? ["asignatura", "tipo"] : []);
    ["asignatura", "tipo"].forEach((k) => $(`#f-${k}`).addEventListener("change", () => tocados.add(k)));
    const sugerir = () => {
      const r = clasificar(`${$("#f-titulo").value} ${$("#f-enlace").value}`, datos.asignaturas);
      const tags = [];
      if (r.asignatura && !tocados.has("asignatura")) { $("#f-asignatura").value = r.asignatura; tags.push(datos.asignaturas.find((a) => a.id === r.asignatura).nombre); }
      if (r.tipo && !tocados.has("tipo")) { $("#f-tipo").value = r.tipo; tags.push(r.tipo); }
      $(".sugerencia").innerHTML = tags.length ? `Clasificado como ${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}` : "";
    };
    $("#f-titulo").addEventListener("input", sugerir);
    $("#f-enlace").addEventListener("input", sugerir);
  }

  // Miniaturas de las fotos elegidas antes de subirlas
  const inputArchivos = $("#f-archivos");
  if (inputArchivos) {
    inputArchivos.addEventListener("change", () => {
      const cont = dlg.querySelector("[data-previas]");
      cont.innerHTML = "";
      for (const f of inputArchivos.files) {
        if (/^image\//.test(f.type)) {
          const img = document.createElement("img");
          img.src = URL.createObjectURL(f);
          img.alt = f.name;
          cont.appendChild(img);
        } else {
          const s = document.createElement("span");
          s.className = "adjunto";
          s.textContent = f.name;
          cont.appendChild(s);
        }
      }
    });
  }

  return new Promise((resolver) => {
    const cerrar = (resultado) => { dlg.close(); dlg.remove(); resolver(resultado); };
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(null); });
    dlg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if ("cancelar" in b.dataset) cerrar(null);
      if ("eliminar" in b.dataset) {
        if (b.dataset.seguro) return cerrar({ borrar: true });
        b.dataset.seguro = "1";
        b.innerHTML = "¿Seguro? Pulsa otra vez";
      }
      if (b.dataset.quitarAdjunto) {
        const ref = (base.archivos || []).find((r) => r.id === b.dataset.quitarAdjunto);
        if (ref) quitados.push(ref);
        b.closest(".adjunto").remove();
      }
    });
    $("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const valores = {};
      let nuevos = [];
      for (const c of campos) {
        const el = $(`#f-${c.k}`);
        if (c.tipo === "archivos") { nuevos = [...el.files]; continue; }
        if (c.tipo === "rico") {
          const html = limpiar(el.innerHTML);
          const texto = textoPlano(html);
          if (c.req && !texto) { $(".error").textContent = `Rellena «${c.label}».`; return; }
          valores[c.k] = texto;
          valores[c.k + "Html"] = html;
          continue;
        }
        if (c.tipo === "grupos") {
          const marcados = [...el.querySelectorAll("input:checked")].map((x) => x.value);
          valores[c.k] = marcados.length === GRUPOS.length ? undefined : marcados; // todo marcado = todos
          continue;
        }
        let v = el.value.trim();
        if (c.req && !v) { $(".error").textContent = `Rellena «${c.label}».`; el.focus(); return; }
        if (c.tipo === "tags") v = v.split(",").map((t) => t.trim()).filter(Boolean);
        if (c.numero || c.tipo === "number") v = v === "" ? "" : Number(v);
        valores[c.k] = v;
      }
      if (valores.fechaFin && valores.fecha && valores.fechaFin < valores.fecha) { $(".error").textContent = "La fecha final no puede ser anterior a la inicial."; return; }
      if (valores.inicio && valores.fin && coleccion === "horario" && valores.fin <= valores.inicio) {
        $(".error").textContent = "La hora de fin tiene que ser después de la de inicio."; return;
      }
      const grande = nuevos.find((f) => f.size > TAMANO_MAXIMO);
      if (grande) { $(".error").textContent = `«${grande.name}» pesa más de 20 MB.`; return; }
      // Foto de perfil: si eliges una nueva, la anterior se sustituye
      if (campos.some((c) => c.una) && nuevos.length) for (const r of base.archivos || []) if (!quitados.includes(r)) quitados.push(r);
      const conservados = (base.archivos || []).filter((r) => !quitados.includes(r));
      if (campos.some((c) => c.tipo === "archivos")) valores.archivos = conservados;
      cerrar({ valores, nuevos, quitados });
    });
    dlg.showModal();
    dlg.querySelector("input, textarea, select")?.focus();
  });
}
