// =============================================================
//  nucleo.js — El "motor" de la web. Lo usan las dos entradas:
//   · index.html (tu profe: solo lectura)
//   · admin.html (tú: con botones para añadir, editar y borrar)
//  Se encarga del menú, de cambiar de sección y de los clics.
// =============================================================
import { esc, nuevoId } from "./comun.js";
import { icono, ponerIconos } from "./iconos.js";
import * as V from "./vistas.js";
import * as archivos from "./archivos.js";
import * as comentarios from "./comentarios.js";

const SECCIONES = [
  ["inicio", "Inicio"],
  ["diario", "Día a día"],
  ["materias", "Materias"],
  ["trabajos", "Trabajos"],
  ["formacion", "Formación"],
  ["calendario", "Calendario"],
];

// ctx = { datos, password, editor, alCambiar(), gh, salir(), cambiarPassword?, estado? }
export function iniciar(raiz, ctx) {
  const hoy = new Date();
  const e = {
    datos: ctx.datos,
    editor: ctx.editor,
    borrando: null,
    filtros: { texto: "" },
    cal: { anio: hoy.getFullYear(), mes: hoy.getMonth(), dia: null },
    comentarios: {},
    visitas: [],
    // En modo edición comentas como tú misma; si no, con el nombre de este dispositivo
    quienSoy: ctx.editor ? { nombre: ctx.datos.config.nombre || "Lorena", rol: "Autora" } : comentarios.quienSoy(),
    meGusta: comentarios.misLikes(),
    comentariosAbiertos: new Set(),
  };
  let ruta = [];

  // ---------- Estructura fija: cabecera + contenido + pie ----------
  const c = e.datos.config;
  raiz.innerHTML = `
    <header class="cabecera">
      <div class="cabecera-in">
        <a class="marca" href="#inicio" aria-label="Inicio">
          <img class="logo-claro" src="img/logo-digitech.png" alt="Digitech">
          <img class="logo-oscuro" src="img/logo-digitech-blanco.png" alt="">
          <span class="marca-sub">Mochila SMX</span>
        </a>
        <nav class="nav" id="nav" aria-label="Secciones">
          ${SECCIONES.map(([id, t]) => `<a class="nav-enlace" href="#${id}" data-seccion="${id}">${t}</a>`).join("")}
        </nav>
        <div class="cab-botones">
          ${ctx.editor ? `<span class="estado-guardado" id="estadoGuardado"><i></i><span>Todo guardado</span></span>
            <button class="pildora clara" type="button" data-accion="perfil">${icono("ajustes")}<span>Ajustes</span></button>
            <a class="pildora azul" href="./" target="_blank" rel="noopener">Vista profe</a>`
          : `<button class="pildora clara" type="button" data-accion="quien" title="Cambiar de nombre">${icono("persona")}<span id="nombreVisitante"></span></button>
            <a class="pildora azul" href="#calendario/horario">Mi horario</a>`}
          <button class="boton icono hamburguesa" type="button" id="botonMenu" aria-expanded="false" aria-controls="nav" aria-label="Menú">${icono("menu")}</button>
        </div>
      </div>
    </header>
    <main class="contenido" id="vista"></main>
    <footer class="pie">
      <img src="img/logo-digitech.png" alt="Digitech" class="logo-claro"><img src="img/logo-digitech-blanco.png" alt="" class="logo-oscuro">
      <span id="pieTexto"></span>
      ${ctx.editor ? `<span class="pie-acciones"><button class="enlace-ver" type="button" data-accion="password">Cambiar contraseña</button> · <button class="enlace-ver" type="button" data-accion="salir">Cerrar sesión</button></span>`
        : `<span class="pie-acciones"><button class="enlace-ver" type="button" data-accion="salir">Cerrar sesión</button></span>`}
    </footer>
    <div class="visor" id="visor" hidden>
      <button type="button" class="visor-cerrar" data-visor="cerrar" aria-label="Cerrar">✕</button>
      <button type="button" class="visor-flecha izq" data-visor="-1" aria-label="Anterior">‹</button>
      <img id="visorImg" alt="">
      <button type="button" class="visor-flecha der" data-visor="1" aria-label="Siguiente">›</button>
      <span class="visor-contador" id="visorContador"></span>
    </div>
    <div class="aviso-flotante" id="aviso" hidden></div>`;
  ponerIconos(raiz);
  raiz.classList.toggle("modo-editar", Boolean(ctx.editor));
  const $ = (s) => raiz.querySelector(s);
  const ponerNombre = () => { const n = $("#nombreVisitante"); if (n) n.textContent = e.quienSoy?.nombre || "Invitado"; };
  ponerNombre();

  function aviso(texto, ms = 2800) {
    const a = $("#aviso");
    a.textContent = texto; a.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(() => (a.hidden = true), ms);
  }

  // ---------- Pintar la sección actual ----------
  function pintar(mantenerScroll = false) {
    const y = window.scrollY;
    const [sec, a, b] = ruta;
    let html;
    if (sec === "diario") html = V.vistaDiario(e);
    else if (sec === "materias") html = V.vistaMaterias(e);
    else if (sec === "materia") html = V.vistaMateria(e, a, b || "apuntes");
    else if (sec === "trabajos") html = V.vistaTrabajos(e);
    else if (sec === "formacion") html = V.vistaFormacion(e);
    else if (sec === "calendario") html = V.vistaCalendario(e, a === "horario" ? "horario" : "mes");
    else html = V.vistaInicio(e);
    $("#vista").innerHTML = `<div class="vista">${html}</div>`;

    const activa = sec === "materia" ? "materias" : SECCIONES.some(([id]) => id === sec) ? sec : "inicio";
    raiz.querySelectorAll(".nav-enlace").forEach((n) =>
      n.dataset.seccion === activa ? n.setAttribute("aria-current", "page") : n.removeAttribute("aria-current"));
    const cfg = e.datos.config;
    $("#pieTexto").textContent = [cfg.nombre, cfg.curso, cfg.centro].filter(Boolean).join(" · ");
    document.title = `${cfg.nombre || "Mochila"} · Mochila SMX`;
    cargarImagenes();
    prepararCarruseles();
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

  // Carruseles de fotos: contador y puntitos al deslizar
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

  // ---------- Visor de fotos a pantalla completa ----------
  const visor = { fotos: [], i: 0 };
  async function mostrarFoto() {
    const ref = visor.fotos[visor.i];
    $("#visorContador").textContent = visor.fotos.length > 1 ? `${visor.i + 1} / ${visor.fotos.length}` : "";
    raiz.querySelectorAll(".visor-flecha").forEach((f) => (f.hidden = visor.fotos.length < 2));
    $("#visorImg").removeAttribute("src");
    try { $("#visorImg").src = await archivos.urlDe(ref, ctx.password); } catch { aviso("La foto aún no está disponible."); }
  }
  function abrirVisor(fotos, i) {
    visor.fotos = fotos; visor.i = i;
    $("#visor").hidden = false;
    document.body.style.overflow = "hidden";
    mostrarFoto();
  }
  function cerrarVisor() { $("#visor").hidden = true; document.body.style.overflow = ""; }
  document.addEventListener("keydown", (ev) => {
    if ($("#visor").hidden) return;
    if (ev.key === "Escape") cerrarVisor();
    if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
      visor.i = (visor.i + (ev.key === "ArrowRight" ? 1 : -1) + visor.fotos.length) % visor.fotos.length;
      mostrarFoto();
    }
  });
  // Deslizar con el dedo en el visor
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
    try { await comentarios.darLike(idPost, e.quienSoy, ctx.password); } catch (err) { aviso(err.message); }
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

  // ---------- Navegación (#seccion/...) ----------
  function irA(hash, reiniciarFiltros = true) {
    const nueva = (hash || "inicio").replace(/^#/, "").split("/").map(decodeURIComponent);
    const cambiaSeccion = nueva[0] !== ruta[0] || nueva[1] !== ruta[1];
    ruta = nueva;
    if (cambiaSeccion && reiniciarFiltros) e.filtros = { texto: "" };
    e.borrando = null;
    $("#nav").classList.remove("abierto");
    $("#botonMenu").setAttribute("aria-expanded", "false");
    pintar();
    if (ruta[0] === "diario" && ruta[1]) {
      document.getElementById(`post-${ruta[1]}`)?.scrollIntoView({ block: "start" });
    } else if (cambiaSeccion) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", () => irA(location.hash));

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
        for (const f of nuevos) valores.archivos.push(await archivos.subir(ctx.gh, await archivos.prepararImagen(f), ctx.password));
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

  // ---------- Clics ----------
  raiz.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button, a");
    if (!b) return;
    const ds = b.dataset;

    if (b.id === "botonMenu") {
      const abierto = $("#nav").classList.toggle("abierto");
      b.setAttribute("aria-expanded", String(abierto));
      return;
    }
    if (ds.ir) { location.hash = "#" + ds.ir; return; }
    if (ds.accion === "salir") return ctx.salir();
    if (ds.accion === "quien") return ctx.cambiarQuien?.();
    if (ds.visor) {
      if (ds.visor === "cerrar") return cerrarVisor();
      visor.i = (visor.i + Number(ds.visor) + visor.fotos.length) % visor.fotos.length;
      return mostrarFoto();
    }
    if (ds.verFoto) {
      const [idPost, i] = ds.verFoto.split(":");
      const post = e.datos.posts.find((x) => x.id === idPost);
      const fotos = (post?.archivos || []).filter((r) => /^image\//.test(r.tipo));
      // doble toque = me gusta; un toque = abrir la foto
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
    if (b.classList.contains("miniatura") && ds.descargar) {
      const ref = buscarArchivo(ds.descargar);
      if (ref) return abrirVisor([ref], 0);
    }
    if (ds.accion === "perfil") return editar("config");
    if (ds.accion === "password") return ctx.cambiarPassword?.();

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
    if (ds.ocultarComentario && ctx.editor) {
      const lista = e.datos.comentariosOcultos;
      const i = lista.indexOf(ds.ocultarComentario);
      if (i >= 0) lista.splice(i, 1); else lista.push(ds.ocultarComentario);
      ctx.alCambiar();
      return pintar(true);
    }

    if (!ctx.editor) return;
    if (ds.nuevo) {
      const preset = Object.fromEntries((ds.preset || "").split("&").filter(Boolean).map((p) => p.split("=")));
      return editar(ds.nuevo, null, preset);
    }
    if (ds.editar) { const [col, id] = ds.editar.split(":"); return editar(col, id); }
    if (ds.borrar) { e.borrando = ds.borrar; return pintar(true); }
    if ("borrarNo" in ds) { e.borrando = null; return pintar(true); }
    if (ds.borrarSi) { const [col, id] = ds.borrarSi.split(":"); return borrar(col, id); }
  });

  // Buscadores (sin perder el cursor al escribir)
  raiz.addEventListener("input", (ev) => {
    if (!ev.target.matches("[data-buscar]")) return;
    e.filtros.texto = ev.target.value;
    const pos = ev.target.selectionStart;
    pintar(true);
    const nuevo = raiz.querySelector("[data-buscar]");
    if (nuevo) { nuevo.focus(); nuevo.setSelectionRange(pos, pos); }
  });

  // Enviar un comentario
  raiz.addEventListener("submit", async (ev) => {
    const form = ev.target.closest("[data-comentar]");
    if (!form) return;
    ev.preventDefault();
    const fd = new FormData(form);
    const yo = e.quienSoy || { nombre: String(fd.get("nombre") || "").trim(), rol: String(fd.get("rol") || "") };
    if (!e.quienSoy && yo.nombre) { comentarios.guardarQuienSoy(yo); e.quienSoy = yo; ponerNombre(); }
    const texto = String(fd.get("texto") || "").trim();
    if (!yo.nombre || !texto) return aviso("Escribe tu nombre y el comentario.");
    const boton = form.querySelector("button[type=submit]");
    boton.disabled = true;
    try {
      await comentarios.enviar(form.dataset.comentar, { ...yo, texto }, ctx.password);
      await cargarComentarios();
      aviso("Comentario enviado");
    } catch (err) {
      aviso(err.message);
      boton.disabled = false;
    }
  });

  async function cargarComentarios() {
    if (!comentarios.activos()) return;
    try {
      const r = await comentarios.cargar(ctx.password);
      e.comentarios = r.porPost; e.visitas = r.visitas;
    } catch { e.comentarios = {}; }
    if (ruta[0] === "diario" || ruta[0] === "inicio" || !ruta[0]) pintar(true);
  }

  // ---------- Arranque ----------
  irA(location.hash);
  cargarComentarios();

  return {
    pintar: () => pintar(true),
    ponerEstado(clase, texto) {
      const el = $("#estadoGuardado");
      if (!el) return;
      el.className = `estado-guardado ${clase || ""}`;
      el.querySelector("span").textContent = texto;
    },
    aviso,
    set datos(d) { e.datos = d; pintar(true); },
  };
}
