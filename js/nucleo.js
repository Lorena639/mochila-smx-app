// =============================================================
//  nucleo.js — El "motor" de la app. Lo usan las dos entradas:
//   · index.html (visitantes: familia, profes, amigos)
//   · admin.html (tú: con todo lo necesario para editar)
//  Dibuja el marco (menú lateral, barra inferior en el móvil, cabecera),
//  cambia de sección y reparte los clics a cada módulo.
// =============================================================
import { esc, nuevoId, normalizar, hoyIso } from "./comun.js";
import { icono, ponerIconos } from "./iconos.js";
import * as V from "./vistas.js";
import * as archivos from "./archivos.js";
import * as comentarios from "./comentarios.js";
import * as A from "./asistencia.js";
import { GRUPOS, grupoDe, partesDe, filtrarPara } from "./grupos.js";
import * as Notas from "./notas.js";
import * as Faltas from "./faltas.js";
import * as Comunidad from "./comunidad.js";
import * as Estudio from "./estudio.js";
import * as Herr from "./herramientas.js";
import * as Py from "./python.js";
import * as Estada from "./estada.js";
import * as Extras from "./extras.js";
import { exportarWord, exportarPDF } from "./editor.js";
import { contenido } from "./editor.js";

// ---------- Secciones ----------
// parte: la "parte" que tiene que poder ver un grupo · editor: solo en modo edición
const SECCIONES = [
  { id: "inicio", t: "Inicio", ic: "inicio" },
  { id: "diario", t: "Día a día", ic: "diario", parte: "diario" },
  { id: "materias", t: "Materias", ic: "materias", parte: "materias", grupo: "Estudios" },
  { id: "notas", t: "Notas", ic: "nota", parte: "notas", grupo: "Estudios" },
  { id: "trabajos", t: "Trabajos", ic: "trabajos", parte: "trabajos", grupo: "Estudios" },
  { id: "formacion", t: "Formación", ic: "formacion", parte: "formacion", grupo: "Estudios" },
  { id: "estudio", t: "Estudiar", ic: "estudiar", parte: "estudio", grupo: "Estudios" },
  { id: "herramientas", t: "Herramientas", ic: "herramienta", parte: "herramientas", grupo: "Estudios" },
  { id: "calendario", t: "Calendario", ic: "calendario", parte: "calendario", grupo: "Agenda" },
  { id: "asistencia", t: "Asistencia", ic: "ubicacion", parte: "asistencia", grupo: "Agenda" },
  { id: "estada", t: "Prácticas", ic: "maletin", parte: "estada", grupo: "Agenda" },
  { id: "comunidad", t: "Foro", ic: "comentario", comunidad: true, grupo: "Comunidad" },
  { id: "buzon", t: "Buzón privado", ic: "buzon", comunidad: true, grupo: "Comunidad" },
  { id: "ajustes", t: "Ajustes", ic: "ajustes", editor: true, grupo: "Gestión" },
];
// A qué sección pertenece cada ruta
const RUTA_SECCION = { materia: "materias", python: "estudio" };

// Módulos que responden a data-accion, data-form y data-cambio
const MODULOS = [Notas, Faltas, Comunidad, Estudio, Herr, Py, Estada, Extras, A];
const ACCIONES = Object.assign({}, ...MODULOS.map((m) => m.acciones || {}));
const FORMULARIOS = Object.assign({}, ...MODULOS.map((m) => m.formularios || {}));
const CAMBIOS = Object.assign({}, ...MODULOS.map((m) => m.cambios || {}));
// Lo único que puede hacer un visitante (el resto es solo de edición)
const PERMITIDO_VISITANTE = new Set(["foro-nuevo", "foro-tema", "foro-respuesta", "buzon-enviar", "herr-cat", "avisos-sistema", "avisos-cerrar", "avisos-permiso", "push-activar", "push-desactivar", "buzon-seguir",
  "py-ejecutar", "py-ej", "py-libre"]); // ver y probar, sin guardar nada

// ---------- Tema claro / oscuro ----------
const CLAVE_TEMA = "mochila-tema";
export function aplicarTema(t) {
  const tema = t || (() => { try { return localStorage.getItem(CLAVE_TEMA); } catch { return null; } })();
  if (tema === "claro" || tema === "oscuro") document.documentElement.dataset.tema = tema;
  else delete document.documentElement.dataset.tema;
}
const temaActual = () => document.documentElement.dataset.tema || (matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");

// ctx = { datos, password, editor, alCambiar(), gh, salir(), cambiarPassword?, abrirGrupos?, reemplazarDatos?,
//         secciones?, acceso?, claveFichajes?, grupo?, clavesComunidad?, cambiarQuien? }
export function iniciar(raiz, ctx) {
  aplicarTema();
  const hoy = new Date();
  const e = {
    datos: ctx.datos,
    editor: ctx.editor,
    borrando: null,
    filtros: { texto: "" },
    cal: { anio: hoy.getFullYear(), mes: hoy.getMonth(), dia: null },
    comentarios: {},
    visitas: [],
    quienSoy: ctx.editor ? { nombre: ctx.datos.config.nombre || "Lorena", rol: "Autora" } : comentarios.quienSoy(),
    meGusta: comentarios.misLikes(),
    comentariosAbiertos: new Set(),
    fichajes: null,
    errorFichajes: "",
    fichando: false,
    comoGrupo: null,
    foro: null,
    buzon: null,
    repaso: null,
    herr: {},
    avisosAbiertos: false,
  };
  let ruta = [];

  // ---------- Quién ve qué ----------
  const acceso = () => ctx.acceso || (e.datos.config.claves?.comentarios ? { clave: e.datos.config.claves.comentarios } : ctx.password);
  const claveFichajes = () => ctx.claveFichajes || (ctx.editor ? e.datos.config.claves?.fichajes : null);
  const clavesComunidad = () => {
    if (e.comoGrupo) { const k = e.datos.config.claves?.foro || {}; return { foro: { [e.comoGrupo]: k[e.comoGrupo] }, buzonPublica: e.datos.config.claves?.buzon?.publica }; }
    return Comunidad.clavesDe(ctx, e.datos);
  };
  const esEditor = () => ctx.editor && !e.comoGrupo;
  function partesActuales() {
    if (e.comoGrupo) return partesDe(e.datos.config.grupos?.[e.comoGrupo], e.comoGrupo);
    return ctx.secciones || null;
  }
  function veParte(parte) {
    if (!parte) return true;
    if (parte === "asistencia") {
      if (e.comoGrupo) return partesActuales().includes("asistencia");
      if (!claveFichajes() && !ctx.editor) return false;
    }
    const p = partesActuales();
    return !p || p.includes(parte);
  }
  function veSeccion(s) {
    if (!s) return false;
    if (s.editor) return esEditor();
    if (s.comunidad) return comentarios.activos();
    return veParte(s.parte);
  }
  const seccion = (id) => SECCIONES.find((s) => s.id === (RUTA_SECCION[id] || id));
  e.ve = (parte) => veParte(parte);

  // ---------- Marco fijo ----------
  const c = e.datos.config;
  raiz.innerHTML = `
    <aside class="app-lateral" id="lateral"></aside>
    <div class="app-principal">
      <header class="app-cabecera">
        <a class="logo-movil" href="#inicio" aria-label="Inicio"><img class="logo-claro" src="img/logo-digitech.png" alt="Digitech"><img class="logo-oscuro" src="img/logo-digitech-blanco.png" alt=""></a>
        <button type="button" class="buscar-falso" data-accion="paleta" aria-label="Buscar">${icono("buscar")}<span>${ctx.editor ? "Buscar o preguntar…" : `Buscar en la mochila de ${esc(c.nombre || "Lorena")}…`}</span><kbd>Ctrl K</kbd></button>
        <div class="cab-derecha">
          ${ctx.editor ? `<span class="estado-guardado" id="estadoGuardado"><i></i><span>Todo guardado</span></span>
            <span class="pildora-reloj" id="pildoraReloj" hidden><span data-reloj-mini></span></span>
            <button class="boton solo-pc" type="button" data-accion="vercomo" title="Ver la app como la ve cada grupo">${icono("ojo")}<span id="textoVerComo">Ver como…</span></button>`
            : `<span class="chip acento solo-pc">${icono("candado")}Acceso ${esc(ctx.grupo ? grupoDe(ctx.grupo).nombre : "completo")}</span>`}
          <button class="boton icono" type="button" data-accion="tema" aria-label="Cambiar entre modo claro y oscuro" id="botonTema"></button>
          <span class="campana-zona"><button class="boton icono" type="button" data-accion="avisos" aria-label="Avisos" id="botonAvisos">${icono("campana")}<span class="insignia" id="insignia" hidden></span></button>
            <div id="panelAvisos"></div></span>
          ${ctx.editor ? `<span class="nuevo-zona"><button class="boton principal solo-pc" type="button" data-accion="nuevo-menu">${icono("mas")}Nuevo</button><div id="menuNuevo"></div></span>` : ""}
        </div>
      </header>
      <main class="contenido" id="vista"></main>
    </div>
    <nav class="app-barra-inf" id="barraInf" aria-label="Secciones"></nav>
    ${ctx.editor ? `<button type="button" class="fab" data-accion="nuevo-menu" aria-label="Nuevo">${icono("mas")}</button>` : ""}
    <div class="visor" id="visor" hidden>
      <button type="button" class="visor-cerrar" data-visor="cerrar" aria-label="Cerrar">${icono("cerrar")}</button>
      <button type="button" class="visor-flecha izq" data-visor="-1" aria-label="Anterior">${icono("flecha-izq")}</button>
      <img id="visorImg" alt="">
      <button type="button" class="visor-flecha der" data-visor="1" aria-label="Siguiente">${icono("flecha-der")}</button>
      <span class="visor-contador" id="visorContador"></span>
    </div>
    <div class="paleta" id="paleta" hidden></div>
    <div class="aviso-flotante" id="aviso" hidden></div>`;
  raiz.classList.add("app");
  raiz.classList.toggle("modo-editar", Boolean(ctx.editor));
  const $ = (s) => raiz.querySelector(s);

  function aviso(texto, ms = 2800) {
    const a = $("#aviso");
    a.textContent = texto; a.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(() => (a.hidden = true), ms);
  }

  // ---------- Menús ----------
  function pintarMenus(activa) {
    const visibles = SECCIONES.filter(veSeccion);
    const grupos = [];
    for (const s of visibles) {
      const g = s.grupo || "";
      if (!grupos.length || grupos[grupos.length - 1].g !== g) grupos.push({ g, items: [] });
      grupos[grupos.length - 1].items.push(s);
    }
    const nombreSec = (s) => s.id === "buzon" && !esEditor() ? `Escribir a ${esc(c.nombre || "Lorena")}` : s.t;
    const yo = e.quienSoy || { nombre: "Invitado", rol: "" };
    $("#lateral").innerHTML = `<a class="lat-logo" href="#inicio"><img src="img/logo-digitech-blanco.png" alt="Digitech"><span>Mochila SMX</span></a>
      <nav class="lat-nav" aria-label="Secciones">${grupos.map((g) => `${g.g ? `<div class="lat-grupo">${g.g}</div>` : ""}${g.items.map((s) =>
        `<a href="#${s.id}" class="${activa === s.id ? "on" : ""}" ${activa === s.id ? 'aria-current="page"' : ""}>${icono(s.ic)}<span>${nombreSec(s)}</span></a>`).join("")}`).join("")}</nav>
      <button type="button" class="lat-pie" ${ctx.editor ? 'data-ir="ajustes"' : 'data-accion="quien"'} title="${ctx.editor ? "Ajustes" : "Cambiar de nombre"}">
        ${V.avatarPersona(yo.nombre, yo.rol)}<span><b>${esc(ctx.editor ? c.nombre || "Lorena" : yo.nombre)}</b><small>${ctx.editor ? (e.comoGrupo ? `Viendo como ${grupoDe(e.comoGrupo).nombre}` : "Modo edición") : esc(yo.rol || "")}</small></span></button>`;
    // Barra inferior del móvil: 4 secciones + "Más"
    const preferidas = ["inicio", "diario", veSeccion(seccion("materias")) ? "materias" : "formacion", veSeccion(seccion("calendario")) ? "calendario" : "comunidad"]
      .filter((id, i, a) => veSeccion(seccion(id)) && a.indexOf(id) === i);
    const etiquetaInf = { materias: "Estudios", calendario: "Agenda", comunidad: "Foro" };
    const enMas = !preferidas.includes(activa);
    $("#barraInf").innerHTML = preferidas.map((id) => { const s = seccion(id);
      return `<a href="#${id}" class="${activa === id ? "on" : ""}"><span class="burbuja">${icono(s.ic)}</span>${etiquetaInf[id] || s.t}</a>`; }).join("")
      + `<a href="#mas" class="${enMas ? "on" : ""}"><span class="burbuja">${icono("puntos")}</span>Más</a>`;
    const t = $("#textoVerComo");
    if (t) t.textContent = e.comoGrupo ? `Viendo: ${grupoDe(e.comoGrupo).nombre}` : "Ver como…";
    $("#botonTema").innerHTML = icono(temaActual() === "oscuro" ? "sol" : "luna");
    pintarAvisos(false);
  }

  function vistaMas() {
    const visibles = SECCIONES.filter(veSeccion);
    return `<header class="cabecera-seccion"><div><h1>Todas las secciones</h1></div></header>
      <div class="rejilla-mas">${visibles.map((s) => `<a class="panel mas-item" href="#${s.id}">${icono(s.ic)}<b>${s.id === "buzon" && !esEditor() ? `Escribir a ${esc(c.nombre || "Lorena")}` : s.t}</b></a>`).join("")}
        ${ctx.editor ? "" : `<button type="button" class="panel mas-item" data-accion="quien">${icono("persona")}<b>Cambiar mi nombre</b></button>`}
        <button type="button" class="panel mas-item" data-accion="salir">${icono("salir")}<b>Cerrar sesión</b></button></div>`;
  }

  // ---------- Pintar la sección actual ----------
  function pintar(mantenerScroll = false) {
    const y = window.scrollY;
    let [sec, a, b] = ruta;
    sec ||= "inicio";
    if (sec !== "mas" && !veSeccion(seccion(sec))) sec = "inicio";
    // "Ver como": misma app con los datos que recibiría ese grupo y sin botones de editar
    const v = e.comoGrupo
      ? { ...e, datos: filtrarPara(e.datos, e.comoGrupo), editor: false, visitas: [], buzon: null, quienSoy: { nombre: "Vista previa", rol: grupoDe(e.comoGrupo).rol } }
      : e;
    if (sec === "python" && esEditor() && Py.prepararPython(e.datos)) ctx.alCambiar?.();
    const claves = clavesComunidad();
    let html;
    switch (sec) {
      case "diario": html = V.vistaDiario(v); break;
      case "materias": html = V.vistaMaterias(v); break;
      case "materia": html = V.vistaMateria(v, a, b || "apuntes"); break;
      case "notas": html = Notas.vistaNotas(v); break;
      case "trabajos": html = V.vistaTrabajos(v); break;
      case "formacion": html = V.vistaFormacion(v); break;
      case "estudio": html = a === "examen" ? Estudio.vistaExamen(v, b) : Estudio.vistaEstudio(v, a || "tarjetas"); break;
      case "python": html = Py.vistaPython(v); break;
      case "herramientas": html = Herr.vistaHerramientas(v, a || ""); break;
      case "calendario": html = V.vistaCalendario(v, a === "horario" ? "horario" : "mes"); break;
      case "asistencia": html = A.vistaAsistencia(v); break;
      case "estada": html = Estada.vistaEstada(v); break;
      case "comunidad": html = a ? Comunidad.vistaTema(v, a, claves) : Comunidad.vistaComunidad(v, claves); if (!a) Extras.marcarForoVisto(); break;
      case "buzon": html = Comunidad.vistaBuzon(v, claves); break;
      case "ajustes": html = Extras.vistaAjustes(v); break;
      case "mas": html = vistaMas(); break;
      default: html = V.vistaInicio(v);
    }
    const banda = e.comoGrupo ? `<div class="banda-vercomo">${icono("ojo")}<span>Estás viendo la app como la ve <b>${esc(grupoDe(e.comoGrupo).nombre)}</b>.</span>
      <button class="boton peque" type="button" data-accion="vercomo-salir">Volver a mi vista</button></div>` : "";
    $("#vista").innerHTML = `<div class="vista">${banda}${html}</div>`;
    const activa = sec === "mas" ? "mas" : seccion(sec)?.id || "inicio";
    pintarMenus(activa);
    document.title = `${c.nombre || "Mochila"} · Mochila SMX`;
    cargarImagenes();
    prepararCarruseles();
    const reloj = $("#pildoraReloj");
    if (reloj) reloj.hidden = !Estudio.temporizadorActivo();
    if (mantenerScroll) window.scrollTo(0, y);
  }

  // Las imágenes están cifradas: se descifran al mostrarlas
  function cargarImagenes() {
    raiz.querySelectorAll("img[data-img]").forEach(async (img) => {
      const ref = buscarArchivo(img.dataset.img);
      if (!ref) return;
      try { img.src = await archivos.urlDe(ref, ctx.password); } catch { img.alt = "No disponible todavía"; }
    });
  }
  function prepararCarruseles() {
    raiz.querySelectorAll(".carrusel-marco").forEach((marco) => {
      const car = marco.querySelector(".carrusel");
      const total = car.children.length;
      if (total < 2) return;
      const puntos = marco.nextElementSibling?.classList.contains("puntos-carrusel") ? marco.nextElementSibling.children : [];
      car.addEventListener("scroll", () => {
        const i = Math.round(car.scrollLeft / car.clientWidth);
        const cont = marco.querySelector(".carrusel-contador");
        if (cont) cont.textContent = `${i + 1}/${total}`;
        [...puntos].forEach((p, k) => p.classList.toggle("on", k === i));
      }, { passive: true });
    });
  }
  function buscarArchivo(id) {
    const d = e.datos;
    const perfil = (d.config.archivos || []).find((x) => x.id === id);
    if (perfil) return perfil;
    for (const col of ["trabajos", "apuntes", "posts", "formacion"]) {
      for (const item of d[col]) { const r = (item.archivos || []).find((x) => x.id === id); if (r) return r; }
    }
    return null;
  }

  // ---------- Visor de fotos ----------
  const visor = { fotos: [], i: 0 };
  async function mostrarFoto() {
    const ref = visor.fotos[visor.i];
    $("#visorContador").textContent = visor.fotos.length > 1 ? `${visor.i + 1} / ${visor.fotos.length}` : "";
    raiz.querySelectorAll(".visor-flecha").forEach((f) => (f.hidden = visor.fotos.length < 2));
    $("#visorImg").removeAttribute("src");
    try { $("#visorImg").src = await archivos.urlDe(ref, ctx.password); } catch { aviso("La foto aún no está disponible."); }
  }
  function abrirVisor(fotos, i) { visor.fotos = fotos; visor.i = i; $("#visor").hidden = false; document.body.style.overflow = "hidden"; mostrarFoto(); }
  function cerrarVisor() { $("#visor").hidden = true; document.body.style.overflow = ""; }
  let toqueX = null;
  $("#visor").addEventListener("touchstart", (ev) => { toqueX = ev.touches[0].clientX; }, { passive: true });
  $("#visor").addEventListener("touchend", (ev) => {
    if (toqueX === null || visor.fotos.length < 2) return;
    const dx = ev.changedTouches[0].clientX - toqueX;
    toqueX = null;
    if (Math.abs(dx) < 50) return;
    visor.i = (visor.i + (dx < 0 ? 1 : -1) + visor.fotos.length) % visor.fotos.length;
    mostrarFoto();
  });

  // ---------- Paleta: buscar y preguntar (Ctrl+K) ----------
  function abrirPaleta(q = "") {
    const p = $("#paleta");
    p.hidden = false;
    p.innerHTML = `<div class="paleta-caja" role="dialog" aria-label="Buscar">
      <label class="paleta-entrada">${icono("buscar")}<input id="paletaQ" autocomplete="off" placeholder="${esEditor() ? "Busca o pregunta: «¿qué tengo mañana?»" : "Buscar…"}" value="${esc(q)}"><kbd>Esc</kbd></label>
      <div class="paleta-res" id="paletaRes"></div></div>`;
    const input = $("#paletaQ");
    input.focus();
    input.setSelectionRange(q.length, q.length);
    resultadosPaleta(q);
    input.addEventListener("input", () => resultadosPaleta(input.value));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { const primero = p.querySelector("[data-ir], a[href]"); if (primero) primero.click(); }
    });
  }
  function cerrarPaleta() { $("#paleta").hidden = true; $("#paleta").innerHTML = ""; }
  function resultadosPaleta(q) {
    const d = e.comoGrupo ? filtrarPara(e.datos, e.comoGrupo) : e.datos;
    const n = normalizar(q.trim());
    const res = [];
    const respuesta = esEditor() && n ? Estudio.responder(e, q) : "";
    if (!n) {
      if (esEditor()) res.push(`<div class="paleta-sug">${Estudio.SUGERENCIAS.map((s) => `<button type="button" class="chip" data-paleta-q="${esc(s)}">${esc(s)}</button>`).join("")}</div>`);
      res.push(...SECCIONES.filter(veSeccion).map((s) => `<a class="paleta-item" href="#${s.id}">${icono(s.ic)}<span>${s.t}</span><small>Sección</small></a>`));
    } else {
      for (const s of SECCIONES.filter(veSeccion)) if (normalizar(s.t).includes(n)) res.push(`<a class="paleta-item" href="#${s.id}">${icono(s.ic)}<span>${s.t}</span><small>Sección</small></a>`);
      const buscar = (lista, texto, ruta2, tipo, ic) => {
        for (const x of lista) if (normalizar(texto(x)).includes(n)) res.push(`<button type="button" class="paleta-item" data-ir="${esc(ruta2(x))}">${icono(ic)}<span>${esc(x.titulo || x.nombre || x.texto?.slice(0, 60))}</span><small>${tipo}</small></button>`);
      };
      if (veParte("materias")) buscar(d.asignaturas, (x) => x.nombre, (x) => `materia/${x.id}`, "Materia", "materias");
      if (veParte("materias")) buscar(d.apuntes, (x) => `${x.titulo} ${x.texto}`, (x) => `materia/${x.asignatura}/apuntes`, "Apuntes", "materias");
      if (veParte("trabajos")) buscar(d.trabajos, (x) => `${x.titulo} ${x.descripcion || ""}`, () => "trabajos", "Trabajo", "trabajos");
      if (veParte("diario")) buscar(d.posts, (x) => `${x.titulo} ${x.texto} ${(x.etiquetas || []).join(" ")}`, (x) => `diario/${x.id}`, "Día a día", "diario");
      if (veParte("calendario")) buscar(d.eventos, (x) => `${x.titulo} ${x.tipo}`, () => "calendario", "Fecha", "calendario");
      if (veParte("formacion")) buscar(d.formacion, (x) => `${x.titulo} ${x.entidad || ""}`, () => "formacion", "Formación", "formacion");
      buscar(e.foro?.temas || [], (x) => `${x.titulo} ${x.texto}`, (x) => `comunidad/${x.id}`, "Foro", "comentario");
      buscar(Herr.lista().map((x) => ({ ...x, titulo: x.t })), (x) => `${x.t} ${x.desc}`, (x) => `herramientas/${x.id}`, "Herramienta", "herramienta");
      if (esEditor()) buscar(Herr.CHULETAS ? Object.values(Herr.CHULETAS).flatMap((cc) => cc.items.map((it) => ({ titulo: `${it.cmd} — ${it.desc}` }))) : [], (x) => x.titulo, () => "herramientas/chuletas", "Chuleta", "terminal");
    }
    $("#paletaRes").innerHTML = `${respuesta ? `<div class="paleta-respuesta">${icono("chispa")}<div>${respuesta}</div></div>` : ""}
      ${res.slice(0, 40).join("") || (respuesta ? "" : `<p class="texto-suave paleta-vacia">Sin resultados.</p>`)}`;
  }

  // ---------- Avisos (campana) ----------
  function pintarAvisos(abrir) {
    const lista = Extras.calcularAvisos(e.comoGrupo ? { ...e, datos: filtrarPara(e.datos, e.comoGrupo), editor: false } : e);
    const ins = $("#insignia");
    const importantes = lista.filter((x) => x.nivel !== "info").length || lista.length;
    ins.hidden = !lista.length;
    ins.textContent = importantes > 9 ? "9+" : String(importantes);
    if (abrir !== undefined) e.avisosAbiertos = abrir;
    $("#panelAvisos").innerHTML = e.avisosAbiertos ? Extras.htmlPanelAvisos(lista, !esEditor() && clavesComunidad()?.avisos) : "";
    return lista;
  }

  // ---------- Navegación ----------
  function irA(hash, reiniciarFiltros = true) {
    const nueva = (hash || "inicio").replace(/^#/, "").split("/").map(decodeURIComponent);
    const cambiaSeccion = nueva[0] !== ruta[0] || nueva[1] !== ruta[1];
    ruta = nueva;
    if (cambiaSeccion && reiniciarFiltros) e.filtros = { texto: "" };
    e.borrando = null;
    e.avisosAbiertos = false;
    cerrarPaleta();
    $("#menuNuevo") && ($("#menuNuevo").innerHTML = "");
    pintar();
    if (ruta[0] === "diario" && ruta[1]) document.getElementById(`post-${ruta[1]}`)?.scrollIntoView({ block: "start" });
    else if (cambiaSeccion) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", () => irA(location.hash));

  // ---------- Pequeños diálogos ----------
  function dialogo(html) {
    const dlg = document.createElement("dialog");
    dlg.className = "modal peque";
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    dlg.showModal();
    return dlg;
  }
  function pedirTexto(titulo, valor = "") {
    return new Promise((ok) => {
      const dlg = dialogo(`<form class="modal-caja"><header class="modal-cabecera"><h2>${esc(titulo)}</h2></header>
        <div class="modal-cuerpo"><textarea name="t" rows="3" required>${esc(valor)}</textarea></div>
        <footer class="modal-pie"><button type="button" class="boton" data-no>Cancelar</button><button class="boton principal" type="submit">Aceptar</button></footer></form>`);
      const fin = (v) => { dlg.close(); dlg.remove(); ok(v); };
      dlg.querySelector("[data-no]").onclick = () => fin(null);
      dlg.addEventListener("cancel", () => fin(null));
      dlg.querySelector("form").onsubmit = (ev) => { ev.preventDefault(); fin(dlg.querySelector("textarea").value.trim()); };
    });
  }
  function confirmar(texto) {
    return new Promise((ok) => {
      const dlg = dialogo(`<form class="modal-caja"><div class="modal-cuerpo"><p>${esc(texto)}</p></div>
        <footer class="modal-pie"><button type="button" class="boton" data-no>Cancelar</button><button class="boton peligro" type="submit">Sí</button></footer></form>`);
      const fin = (v) => { dlg.close(); dlg.remove(); ok(v); };
      dlg.querySelector("[data-no]").onclick = () => fin(false);
      dlg.addEventListener("cancel", () => fin(false));
      dlg.querySelector("form").onsubmit = (ev) => { ev.preventDefault(); fin(true); };
    });
  }

  // ---------- API para los módulos ----------
  const api = {
    datos: () => e.datos,
    estado: () => e,
    editor: ctx.editor,
    cambiar(repintar = true) { ctx.alCambiar?.(); if (repintar) pintar(true); },
    pintar: () => pintar(true),
    aviso, pedirTexto, confirmar,
    yo: () => (ctx.editor ? { nombre: e.datos.config.nombre || "Lorena", rol: "Autora" } : e.quienSoy || { nombre: "Invitado", rol: "" }),
    claves: clavesComunidad,
    recargarComunidad: () => cargarComunidad(),
    recargarFichajes: () => cargarFichajes(),
  };

  // ---------- Editar (solo en el panel) ----------
  async function editar(col, id, preset = {}) {
    const { abrirFormulario } = await import("./formularios.js");
    const d = e.datos;
    const item = col === "config" ? d.config : id ? d[col].find((x) => x.id === id) : null;
    const res = await abrirFormulario(col, d, item, preset);
    if (!res) return;
    if (res.borrar) return borrar(col, id);
    const { valores, nuevos = [], quitados = [] } = res;
    if (nuevos.length) {
      aviso(`Subiendo ${nuevos.length} archivo${nuevos.length > 1 ? "s" : ""}…`, 60000);
      try {
        for (const f of nuevos) valores.archivos.push(await archivos.subir(ctx.gh, await archivos.prepararImagen(f)));
        aviso("Archivos subidos");
      } catch (err) { aviso(err.message || "No se ha podido subir un archivo."); }
    }
    for (const r of quitados) archivos.borrar(ctx.gh, r);
    if (col === "config") Object.assign(d.config, valores);
    else if (item) Object.assign(item, valores);
    else d[col].push({ id: nuevoId(), ...valores });
    ctx.alCambiar();
    pintar(true);
  }
  function borrar(col, id) {
    const d = e.datos;
    const item = d[col].find((x) => x.id === id);
    if (!item) return;
    for (const r of item.archivos || []) archivos.borrar(ctx.gh, r);
    d[col] = d[col].filter((x) => x.id !== id);
    e.borrando = null;
    ctx.alCambiar();
    if (col === "asignaturas") location.hash = "#materias";
    else pintar(true);
    aviso("Borrado");
  }

  // ---------- Me gusta ----------
  async function darLike(idPost, marco) {
    if (!comentarios.activos()) return;
    if (marco) { marco.classList.remove("latido"); void marco.offsetWidth; marco.classList.add("latido"); }
    if (e.meGusta.has(idPost)) return;
    if (!e.quienSoy) return aviso("Primero dinos quién eres.");
    e.meGusta.add(idPost);
    comentarios.guardarMisLikes(e.meGusta);
    (e.comentarios[idPost] ||= []).push({ id: "tmp", tipo: "like", nombre: e.quienSoy.nombre });
    pintar(true);
    try { await comentarios.darLike(idPost, e.quienSoy, acceso()); } catch (err) { aviso(err.message); }
  }

  // ---------- Fichar ----------
  async function ficharAhora(accion) {
    const clave = claveFichajes();
    if (!clave) return aviso("Espera a que ponga «Todo guardado» y vuelve a probar.");
    e.fichando = true; pintar(true);
    aviso("Comprobando tu ubicación…", 20000);
    try {
      await A.fichar({ accion, instituto: e.datos.config.instituto, clave, metodo: "app" });
      aviso(accion === "entrada" ? "Entrada fichada" : "Salida fichada");
      await cargarFichajes();
    } catch (err) { aviso(err.message, 6000); }
    e.fichando = false; pintar(true);
  }

  // ---------- Exportar apuntes / trabajos ----------
  function exportar(col, id, formatoSalida) {
    const item = e.datos[col].find((x) => x.id === id);
    if (!item) return;
    const campo = col === "apuntes" ? "texto" : "descripcion";
    const a = e.datos.asignaturas.find((x) => x.id === item.asignatura);
    const meta = [e.datos.config.nombreCompleto || e.datos.config.nombre, a?.nombre, item.fecha].filter(Boolean).join(" · ");
    const html = contenido(item, campo);
    if (formatoSalida === "pdf") { if (!exportarPDF(item.titulo, meta, html)) aviso("Permite las ventanas emergentes para exportar a PDF."); }
    else exportarWord(item.titulo, meta, html);
  }

  // ---------- Clics ----------
  raiz.addEventListener("click", async (ev) => {
    if (ev.target.id === "paleta") return cerrarPaleta();
    const b = ev.target.closest("button, a, [data-paleta-q]");
    if (!b) {
      if (e.avisosAbiertos && !ev.target.closest(".panel-avisos")) pintarAvisos(false);
      return;
    }
    const ds = b.dataset;
    if (ds.paletaQ) { $("#paletaQ").value = ds.paletaQ; return resultadosPaleta(ds.paletaQ); }
    if (b.closest("#paleta") && (ds.ir || b.getAttribute("href"))) { cerrarPaleta(); }
    if (ds.ir) { location.hash = "#" + ds.ir; return; }
    if (b.tagName === "A") return; // enlaces normales

    const acc = ds.accion;
    if (acc === "salir") return ctx.salir();
    if (acc === "quien") return ctx.cambiarQuien?.();
    if (acc === "tema") {
      const nuevo = temaActual() === "oscuro" ? "claro" : "oscuro";
      try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch {}
      aplicarTema(nuevo); pintarMenus(seccion(ruta[0] || "inicio")?.id || "inicio"); return;
    }
    if (acc === "paleta") return abrirPaleta(ds.q || "");
    if (acc === "avisos") { ev.stopPropagation(); pintarAvisos(!e.avisosAbiertos); return; }
    if (acc === "avisos-cerrar") return pintarAvisos(false);
    if (ds.visor) {
      if (ds.visor === "cerrar") return cerrarVisor();
      visor.i = (visor.i + Number(ds.visor) + visor.fotos.length) % visor.fotos.length;
      return mostrarFoto();
    }
    if (ds.verFoto) {
      const [idPost, i] = ds.verFoto.split(":");
      const post = e.datos.posts.find((x) => x.id === idPost);
      const fotos = (post?.archivos || []).filter((r) => /^image\//.test(r.tipo));
      const ahora = Date.now();
      if (b._ultimoToque && ahora - b._ultimoToque < 320) { clearTimeout(b._espera); b._ultimoToque = 0; return darLike(idPost, b.closest(".carrusel-marco")); }
      b._ultimoToque = ahora;
      b._espera = setTimeout(() => abrirVisor(fotos, Number(i)), 320);
      return;
    }
    if (ds.carrusel) {
      const car = b.closest(".carrusel-marco").querySelector(".carrusel");
      car.scrollBy({ left: Number(ds.carrusel) * car.clientWidth, behavior: "smooth" });
      return;
    }
    if (ds.like) return darLike(ds.like, raiz.querySelector(`#post-${CSS.escape(ds.like)} .carrusel-marco`));
    if (ds.verComentarios) { e.comentariosAbiertos.add(ds.verComentarios); return pintar(true); }
    if (ds.focoComentario) { document.getElementById(`comentar-${ds.focoComentario}`)?.focus(); return; }
    if (ds.verPost) {
      e.filtros.vista = "feed";
      pintar(true);
      document.getElementById(`post-${ds.verPost}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (b.classList.contains("miniatura") && ds.descargar) { const ref = buscarArchivo(ds.descargar); if (ref) return abrirVisor([ref], 0); }
    if (ds.filtro) {
      const actual = e.filtros[ds.filtro] || "";
      e.filtros[ds.filtro] = ds.valor === actual && ds.filtro === "etiqueta" ? "" : ds.valor;
      return pintar(true);
    }
    if (ds.mes) {
      const f = new Date(e.cal.anio, e.cal.mes + Number(ds.mes), 1);
      e.cal.anio = f.getFullYear(); e.cal.mes = f.getMonth();
      return pintar(true);
    }
    if ("dia" in ds) { e.cal.dia = ds.dia || null; return pintar(true); }
    if (ds.descargar) {
      const ref = buscarArchivo(ds.descargar);
      if (!ref) return;
      aviso("Abriendo archivo…");
      try { await archivos.descargar(ref, ctx.password); } catch (err) { aviso(err.message || "No se ha podido abrir."); }
      return;
    }
    if ("cambiarNombre" in ds) return ctx.cambiarQuien?.();

    // Acciones de los módulos
    if (acc && ACCIONES[acc]) {
      if (!esEditor() && !PERMITIDO_VISITANTE.has(acc) && !acc.startsWith("herr-")) return;
      return ACCIONES[acc](b, api);
    }

    // ---- A partir de aquí, solo en modo edición ----
    if (!ctx.editor) return;
    if (acc === "vercomo") {
      const orden = [null, ...GRUPOS.map((g) => g.id)];
      e.comoGrupo = orden[(orden.indexOf(e.comoGrupo) + 1) % orden.length];
      pintar(true);
      if (e.comoGrupo) aviso(`Vista de ${grupoDe(e.comoGrupo).nombre}${e.datos.config.grupos?.[e.comoGrupo]?.activo ? "" : " (grupo aún sin activar)"}`);
      return;
    }
    if (acc === "vercomo-salir") { e.comoGrupo = null; return pintar(true); }
    if (e.comoGrupo) return;
    if (acc === "nuevo-menu") {
      ev.stopPropagation();
      const m = $("#menuNuevo");
      const abierto = m.innerHTML;
      const opciones = [["posts", "Publicación", "diario"], ["trabajos", "Trabajo", "trabajos"], ["apuntes", "Apuntes", "materias"], ["eventos", "Fecha o examen", "calendario"], ["avisos", "Nota del tablón", "aviso"], ["formacion", "Formación", "formacion"]];
      m.innerHTML = abierto ? "" : `<div class="menu-nuevo">${opciones.map(([col, t, ic]) => `<button type="button" data-nuevo="${col}">${icono(ic)}${t}</button>`).join("")}</div>`;
      if (b.classList.contains("fab")) m.querySelector(".menu-nuevo")?.classList.add("desde-fab");
      return;
    }
    if (acc === "perfil") return editar("config");
    if (acc === "password") return ctx.cambiarPassword?.();
    if (acc === "grupos") return ctx.abrirGrupos?.().then((cambiado) => { if (cambiado) pintar(true); });
    if (acc === "exportar") return exportar(ds.col, ds.id, ds.formato);
    if (ds.fichar) return ficharAhora(ds.fichar);
    if (acc === "aqui") {
      aviso("Buscando tu ubicación…", 20000);
      try {
        const p = await A.posicion();
        $("#insLat").value = p.lat.toFixed(6); $("#insLon").value = p.lon.toFixed(6);
        aviso(`Ubicación encontrada (±${Math.round(p.precision)} m). Pulsa «Guardar ubicación».`);
      } catch (err) { aviso(err.message, 5000); }
      return;
    }
    if ("copiarEnlace" in ds) {
      const enlace = A.enlaceFichaje(e.datos, ds.copiarEnlace);
      try { await navigator.clipboard.writeText(enlace); aviso("Enlace copiado. Pégalo en la automatización."); }
      catch { window.prompt("Copia este enlace:", enlace); }
      return;
    }
    if (ocultarComentario(ds)) return;
    if (ds.nuevo) {
      $("#menuNuevo").innerHTML = "";
      const preset = Object.fromEntries((ds.preset || "").split("&").filter(Boolean).map((p) => p.split("=")));
      return editar(ds.nuevo, null, preset);
    }
    if (ds.editar) { const [col, id] = ds.editar.split(":"); return editar(col, id); }
    if (ds.borrar) { e.borrando = ds.borrar; return pintar(true); }
    if ("borrarNo" in ds) { e.borrando = null; return pintar(true); }
    if (ds.borrarSi) { const [col, id] = ds.borrarSi.split(":"); return borrar(col, id); }
  });
  function ocultarComentario(ds) {
    if (!ds.ocultarComentario) return false;
    const lista = e.datos.comentariosOcultos;
    const i = lista.indexOf(ds.ocultarComentario);
    if (i >= 0) lista.splice(i, 1); else lista.push(ds.ocultarComentario);
    ctx.alCambiar();
    pintar(true);
    return true;
  }
  document.addEventListener("click", (ev) => {
    if (!raiz.contains(ev.target) && e.avisosAbiertos) pintarAvisos(false);
    if (!ev.target.closest(".nuevo-zona, .fab") && $("#menuNuevo")?.innerHTML) $("#menuNuevo").innerHTML = "";
  });

  // ---------- Teclado ----------
  document.addEventListener("keydown", (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); return $("#paleta").hidden ? abrirPaleta() : cerrarPaleta(); }
    if (ev.key === "Escape" && !$("#paleta").hidden) return cerrarPaleta();
    if (ev.key === "Escape" && e.avisosAbiertos) return pintarAvisos(false);
    if (!$("#visor").hidden) {
      if (ev.key === "Escape") cerrarVisor();
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        visor.i = (visor.i + (ev.key === "ArrowRight" ? 1 : -1) + visor.fotos.length) % visor.fotos.length;
        mostrarFoto();
      }
    }
    // Tabulador dentro del editor de código
    if (ev.key === "Tab" && ev.target.matches?.("textarea.codigo")) {
      ev.preventDefault();
      const t = ev.target, i = t.selectionStart;
      t.value = t.value.slice(0, i) + "    " + t.value.slice(t.selectionEnd);
      t.selectionStart = t.selectionEnd = i + 4;
    }
  });

  // ---------- Escribir: buscadores y herramientas ----------
  raiz.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.matches("[data-buscar]") || t.matches("[data-herr]")) {
      if (t.matches("[data-buscar]")) e.filtros.texto = t.value;
      else {
        const v = t.type === "checkbox" ? t.checked : t.value;
        if (!Herr.alEscribir(e.herr, t.dataset.herr, v)) e.herr[t.dataset.herr] = v;
      }
      const sel = t.id ? `#${CSS.escape(t.id)}` : "[data-buscar]";
      const pos = t.selectionStart;
      pintar(true);
      const nuevo = raiz.querySelector(sel);
      if (nuevo) { nuevo.focus(); try { nuevo.setSelectionRange(pos, pos); } catch {} }
    }
  });
  raiz.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.matches("[data-herr]") && t.tagName === "SELECT") { if (!Herr.alEscribir(e.herr, t.dataset.herr, t.value)) e.herr[t.dataset.herr] = t.value; return pintar(true); }
    if (t.matches("[data-herr-archivo]")) return Herr.alArchivo(t, api);
    if (t.matches("[data-restaurar]") && esEditor()) return restaurar(t);
    const k = t.dataset?.cambio;
    if (!k || !CAMBIOS[k]) return;
    if (!esEditor() && !["filtro-asig"].includes(k)) return;
    CAMBIOS[k](t, api);
  });
  async function restaurar(input) {
    const f = input.files[0];
    if (!f) return;
    try {
      const nuevos = await Extras.leerCopia(f);
      if (!(await confirmar("¿Sustituir todo tu contenido por el de la copia? Lo actual se perderá."))) return;
      e.datos = nuevos;
      ctx.reemplazarDatos?.(nuevos);
      pintar(true);
      aviso("Copia restaurada");
    } catch (err) { aviso(err.message || "No se ha podido leer la copia."); }
    input.value = "";
  }

  // ---------- Formularios ----------
  raiz.addEventListener("submit", async (ev) => {
    const form = ev.target;
    // Ubicación del instituto
    if (form.matches('[data-form="instituto"]')) {
      ev.preventDefault();
      if (!esEditor()) return;
      const num = (n) => Number(String(form.elements[n].value).replace(",", "."));
      const lat = num("lat"), lon = num("lon"), radio = num("radio") || A.RADIO_DEFECTO;
      if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) || !lat || !lon) return aviso("Revisa la latitud y la longitud.");
      e.datos.config.instituto = { lat, lon, radio: Math.min(1000, Math.max(50, radio)) };
      ctx.alCambiar(); pintar(true);
      return aviso("Ubicación del instituto guardada");
    }
    const k = form.dataset.form;
    if (k && FORMULARIOS[k]) {
      ev.preventDefault();
      if (!esEditor() && !PERMITIDO_VISITANTE.has(k) && !k.startsWith("herr-")) return;
      const boton = form.querySelector("button[type=submit]");
      if (boton) boton.disabled = true;
      try { await FORMULARIOS[k](form, api); } finally { if (boton) boton.disabled = false; }
      return;
    }
    // Comentario de un post
    const fc = form.closest("[data-comentar]");
    if (!fc) return;
    ev.preventDefault();
    const fd = new FormData(fc);
    const yo = e.quienSoy || { nombre: String(fd.get("nombre") || "").trim(), rol: String(fd.get("rol") || "") };
    if (!e.quienSoy && yo.nombre) { comentarios.guardarQuienSoy(yo); e.quienSoy = yo; }
    const texto = String(fd.get("texto") || "").trim();
    if (!yo.nombre || !texto) return aviso("Escribe tu nombre y el comentario.");
    const boton = fc.querySelector("button[type=submit]");
    boton.disabled = true;
    try {
      await comentarios.enviar(fc.dataset.comentar, { ...yo, texto }, acceso());
      await cargarComentarios();
      aviso("Comentario enviado");
    } catch (err) { aviso(err.message); boton.disabled = false; }
  });

  // ---------- Cargar lo que viene de Supabase ----------
  async function cargarComentarios() {
    if (!comentarios.activos()) return;
    try { const r = await comentarios.cargar(acceso()); e.comentarios = r.porPost; e.visitas = r.visitas; } catch { e.comentarios = {}; }
    if (["diario", "inicio", undefined].includes(ruta[0])) pintar(true);
  }
  async function cargarFichajes() {
    const clave = claveFichajes();
    if (!clave || !comentarios.activos()) return;
    try { e.fichajes = await comentarios.cargarFichajes(clave); e.errorFichajes = ""; } catch (err) { e.errorFichajes = err.message; }
    if (["asistencia", "inicio", undefined].includes(ruta[0])) pintar(true); else pintarAvisos();
  }
  async function cargarComunidad() {
    if (!comentarios.activos()) return;
    try { e.foro = await Comunidad.cargarForo(clavesComunidad()); } catch { e.foro = { temas: [], respuestas: new Map() }; }
    if (ctx.editor) { try { e.buzon = await Comunidad.cargarBuzon(e.datos.config.claves?.buzon?.privada); } catch { e.buzon = []; } }
    try {
      const hilos = ctx.editor ? (e.buzon || []).filter((m) => m.hilo && m.hiloClave).map((m) => ({ id: m.hilo, clave: m.hiloClave })) : Comunidad.misHilos();
      e.respuestasBuzon = await Comunidad.cargarRespuestasBuzon(hilos);
    } catch { e.respuestasBuzon = new Map(); }
    if (["comunidad", "buzon"].includes(ruta[0])) pintar(true); else pintarAvisos();
  }

  // ---------- Arranque ----------
  irA(location.hash);
  Promise.allSettled([cargarComentarios(), cargarFichajes(), cargarComunidad()]).then(() => Extras.notificarAlAbrir(pintarAvisos()));
  setInterval(() => { if (!document.hidden) cargarComunidad(); }, 120000);

  return {
    pintar: () => pintar(true),
    ponerEstado(clase, texto) {
      const el = $("#estadoGuardado");
      if (!el) return;
      el.className = `estado-guardado ${clase || ""}`;
      el.querySelector("span").textContent = texto;
    },
    aviso,
    recargarFichajes: cargarFichajes,
    set datos(d) { e.datos = d; pintar(true); },
  };
}
