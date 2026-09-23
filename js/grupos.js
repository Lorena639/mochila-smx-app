// =============================================================
//  grupos.js — Quién ve qué: Familia, Profes y Amigos
//
//  Cada grupo tiene SU PROPIA contraseña. Al guardar, el modo edición
//  crea un archivo cifrado por grupo (data/grupos/<grupo>.enc.json)
//  que lleva SOLO lo que ese grupo puede ver. Así no basta con
//  "elegir Familia" en una lista: sin su contraseña no hay datos.
//
//  Tu contraseña de siempre (datos.enc.json) sigue abriendo TODO.
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";
import { TIPOS_SIN_CLASE } from "./curso.js";

export const GRUPOS = [
  { id: "familia", nombre: "Familia", rol: "Familia", texto: "Tus padres y familiares" },
  { id: "profes", nombre: "Profes", rol: "Profesor/a", texto: "Profesores y tutores" },
  { id: "amigos", nombre: "Amigos", rol: "Amigo/a", texto: "Amigos y compañeros de clase" },
];
export const grupoDe = (id) => GRUPOS.find((g) => g.id === id);

// Partes de la web que se pueden enseñar u ocultar a cada grupo
export const PARTES = [
  ["diario", "Día a día"],
  ["materias", "Materias y apuntes"],
  ["trabajos", "Trabajos"],
  ["formacion", "Formación"],
  ["calendario", "Calendario y horario"],
  ["tablon", "Tablón de clase"],
  ["notas", "Notas"],
  ["asistencia", "Asistencia (fichajes)"],
  ["estudio", "Estudiar (tarjetas, exámenes, Python)"],
  ["estada", "Prácticas"],
  ["herramientas", "Herramientas"],
];
export const TODAS = PARTES.map(([id]) => id);

// Lo que ve cada grupo si no lo cambias
const POR_DEFECTO = {
  familia: TODAS,
  profes: ["diario", "materias", "trabajos", "formacion", "calendario", "tablon"],
  amigos: ["diario", "formacion"],
};
export const partesDe = (conf, id) => conf?.secciones || POR_DEFECTO[id] || [];

// Grupos activos (con contraseña)
export const activos = (d) => GRUPOS.filter((g) => d.config.grupos?.[g.id]?.activo && d.config.grupos[g.id].password);

// ¿Puede el grupo ver este elemento? (sin "visible" = lo ven todos)
export const visiblePara = (item, id) => !Array.isArray(item.visible) || item.visible.includes(id);

// Copia de los datos con SOLO lo que puede ver el grupo
export function filtrarPara(d, id) {
  const partes = partesDe(d.config.grupos?.[id], id);
  const ve = (p) => partes.includes(p);
  const vis = (lista) => lista.filter((x) => visiblePara(x, id));
  const c = d.config;
  return {
    config: { nombre: c.nombre, curso: c.curso, centro: c.centro, descripcion: c.descripcion, archivos: c.archivos || [],
      calendarioOficial: c.calendarioOficial, fechasCurso: c.fechasCurso },
    // Nombres y colores de las materias hacen falta en todas partes; la teoría solo si ve "Materias"
    asignaturas: d.asignaturas.map((a) => (ve("materias") ? { ...a, email: undefined } : { id: a.id, nombre: a.nombre, color: a.color })),
    horario: ve("calendario") || ve("asistencia") ? d.horario : [],
    eventos: ve("calendario") ? vis(d.eventos) : d.eventos.filter((ev) => (ve("asistencia") && (ev.sinClase || TIPOS_SIN_CLASE.includes(ev.tipo))) || (ve("estudio") && ev.tipo === "Examen" && visiblePara(ev, id))),
    trabajos: ve("trabajos") ? vis(d.trabajos) : [],
    apuntes: ve("materias") ? vis(d.apuntes) : [],
    posts: ve("diario") ? vis(d.posts) : [],
    avisos: ve("tablon") ? vis(d.avisos) : [],
    formacion: ve("formacion") ? vis(d.formacion) : [],
    comentariosOcultos: d.comentariosOcultos || [],
    faltas: ve("asistencia") ? d.faltas || [] : [],
    notas: ve("notas") ? d.notas || {} : {},
    notasPrimero: ve("notas") ? d.notasPrimero || [] : [],
    foro: d.foro || { fijados: [], cerrados: [], ocultos: [] },
    tarjetas: ve("estudio") ? d.tarjetas || [] : [],
    estudio: ve("estudio") ? d.estudio || [] : [],
    python: ve("estudio") ? d.python || null : null,
    estada: ve("estada") ? d.estada || null : null,
  };
}

// Lo que se cifra en data/grupos/<id>.enc.json
export function paqueteGrupo(d, id) {
  const partes = partesDe(d.config.grupos?.[id], id);
  return {
    grupo: id,
    secciones: partes,
    datos: filtrarPara(d, id),
    claves: {
      comentarios: d.config.claves?.comentarios,
      ...(partes.includes("asistencia") ? { fichajes: d.config.claves?.fichajes } : {}),
      // Foro: cada grupo solo tiene la clave de SU grupo (no ve lo de los demás)
      foro: { [id]: d.config.claves?.foro?.[id] },
      buzonPublica: d.config.claves?.buzon?.publica,
      // Notificaciones en el móvil: solo Familia
      ...(id === "familia" && d.config.claves?.avisos ? { avisos: d.config.claves.avisos } : {}),
    },
  };
}

// Archivos que aún usan el cifrado antiguo (con la contraseña) dentro de unos datos
export function archivosAntiguos(datosFiltrados) {
  const refs = [...(datosFiltrados.config.archivos || [])];
  for (const col of ["trabajos", "apuntes", "posts", "formacion"]) for (const x of datosFiltrados[col]) refs.push(...(x.archivos || []));
  return refs.filter((r) => !r.clave);
}

// Etiqueta "Solo Familia · Profes" para lo que no ven todos
export function htmlVisible(item) {
  if (!Array.isArray(item?.visible)) return "";
  const nombres = item.visible.map((id) => grupoDe(id)?.nombre).filter(Boolean);
  return `<span class="solo-para" title="Solo lo ven estos grupos">${icono("candado")}${nombres.length ? esc(nombres.join(" · ")) : "Solo yo"}</span>`;
}

// =============================================================
//  Ventana "Compartir: grupos y contraseñas" (solo en el panel)
//  Devuelve la nueva config.grupos o null si se cancela
// =============================================================
export function abrirGrupos(d, passwordPrincipal) {
  const conf = d.config.grupos || {};
  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.innerHTML = `<form class="modal-caja" novalidate>
    <header class="modal-cabecera"><h2>Compartir por grupos</h2>
      <button type="button" class="boton fantasma" data-cancelar aria-label="Cerrar">${icono("cerrar")}</button></header>
    <div class="modal-cuerpo">
      <p class="nota">Cada grupo entra en la misma web con <b>su propia contraseña</b> y solo recibe lo que marques aquí.
        En cada publicación, trabajo o apunte puedes afinar más con «Visible para».</p>
      ${GRUPOS.map((g) => {
        const c = conf[g.id] || {};
        const partes = partesDe(c, g.id);
        return `<fieldset class="grupo-caja" data-grupo="${g.id}">
          <legend><label class="interruptor"><input type="checkbox" name="activo" ${c.activo ? "checked" : ""}><span>${esc(g.nombre)}</span></label>
            <small>${esc(g.texto)}</small></legend>
          <div class="campo"><label>Contraseña de ${esc(g.nombre)}</label>
            <input name="password" type="text" autocomplete="off" spellcheck="false" value="${esc(c.password || "")}" placeholder="mínimo 8 caracteres"></div>
          <div class="campo"><label>Qué pueden ver</label>
            <div class="casillas">${PARTES.map(([id, t]) => `<label class="casilla"><input type="checkbox" name="parte" value="${id}" ${partes.includes(id) ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>
          </div>
        </fieldset>`;
      }).join("")}
      <p class="nota">Tu contraseña de siempre sigue abriendo <b>todo</b>. Si ya se la diste a alguien, cámbiala
        (abajo del todo, «Cambiar contraseña») para que sea solo tuya y dales a ellos la de su grupo.</p>
      <p class="error" role="alert"></p>
    </div>
    <footer class="modal-pie"><button type="button" class="boton" data-cancelar>Cancelar</button>
      <button type="submit" class="boton principal">Guardar grupos</button></footer>
  </form>`;
  document.body.appendChild(dlg);
  return new Promise((resolver) => {
    const cerrar = (r) => { dlg.close(); dlg.remove(); resolver(r); };
    dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); cerrar(null); });
    dlg.querySelectorAll("[data-cancelar]").forEach((b) => b.addEventListener("click", () => cerrar(null)));
    dlg.querySelector("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const err = dlg.querySelector(".error");
      const nuevo = {};
      const usadas = new Set([passwordPrincipal]);
      for (const g of GRUPOS) {
        const caja = dlg.querySelector(`[data-grupo="${g.id}"]`);
        const activo = caja.querySelector("[name=activo]").checked;
        const password = caja.querySelector("[name=password]").value.trim();
        const secciones = [...caja.querySelectorAll("[name=parte]:checked")].map((x) => x.value);
        if (activo) {
          if (password.length < 8) { err.textContent = `La contraseña de ${g.nombre} necesita al menos 8 caracteres.`; return; }
          if (usadas.has(password)) { err.textContent = `La contraseña de ${g.nombre} tiene que ser distinta de las demás y de la tuya.`; return; }
          usadas.add(password);
        }
        nuevo[g.id] = { activo, password, secciones };
      }
      cerrar(nuevo);
    });
    dlg.showModal();
  });
}
