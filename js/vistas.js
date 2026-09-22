// =============================================================
//  vistas.js — Dibuja cada sección de la web.
//  Cada función recibe el "estado" (datos + si estás editando)
//  y devuelve HTML. No cambia nada: solo pinta.
// =============================================================
import {
  ESTADOS, DIAS, ESTADOS_FORMACION, esc, normalizar, formato, fechaCorta, claseUrgencia, diasHasta, tamano,
} from "./comun.js";
import { icono } from "./iconos.js";
import { activos as comentariosActivos } from "./comentarios.js";

// ---------- Utilidades ----------
const asigDe = (d, id) => d.asignaturas.find((a) => a.id === id);
const colorDe = (d, id) => asigDe(d, id)?.color || "#9AA6BD";
const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
const diaSemana = (f) => ((f.getDay() + 6) % 7) + 1; // 1 = lunes
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fechaLarga = (f) => new Date(f + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const resumen = (t = "", n = 130) => {
  const limpio = t.replace(/```[\s\S]*?```/g, " ").replace(/^#+ /gm, "").replace(/^\s*[-*] /gm, "").replace(/[*`#\[\]]/g, "").replace(/\s+/g, " ").trim();
  return limpio.length > n ? limpio.slice(0, n).trimEnd() + "…" : limpio;
};
const codigo = (a) => (a.nombre.match(/^\d{3,4}/) || [""])[0];
const nombreSinCodigo = (a) => a.nombre.replace(/^\d{3,4}\s*/, "");

// Botones que solo ve la dueña (modo edición)
const botonAnadir = (e, col, texto, preset = "") =>
  e.editor ? `<button class="boton principal" type="button" data-nuevo="${col}" ${preset ? `data-preset="${esc(preset)}"` : ""}>${icono("mas")}${esc(texto)}</button>` : "";
function botonesEdicion(e, col, id) {
  if (!e.editor) return "";
  const clave = `${col}:${id}`;
  if (e.borrando === clave) {
    return `<span class="confirmar">¿Borrar? <button class="boton peque peligro" type="button" data-borrar-si="${esc(clave)}">Sí, borrar</button>
      <button class="boton peque" type="button" data-borrar-no>No</button></span>`;
  }
  return `<span class="edicion"><button class="boton icono" type="button" data-editar="${esc(clave)}" aria-label="Editar">${icono("editar")}</button>
    <button class="boton icono" type="button" data-borrar="${esc(clave)}" aria-label="Borrar">${icono("borrar")}</button></span>`;
}

const cabecera = (titulo, texto, derecha = "") =>
  `<header class="cabecera-seccion"><div><h1>${titulo}</h1>${texto ? `<p>${texto}</p>` : ""}</div>${derecha ? `<div class="cab-der">${derecha}</div>` : ""}</header>`;

const vacio = (texto) => `<div class="vacio">${texto}</div>`;

function buscador(e, ph) {
  return `<label class="buscador">${icono("buscar")}<input type="search" data-buscar placeholder="${esc(ph)}" aria-label="${esc(ph)}" value="${esc(e.filtros.texto)}"></label>`;
}
function chips(lista, activo, clave) {
  return lista.map(([valor, texto, color]) =>
    `<button type="button" class="chip" aria-pressed="${String(activo ?? "") === String(valor)}" data-filtro="${clave}" data-valor="${esc(valor)}">${color ? `<span class="punto" style="background:${esc(color)}"></span>` : ""}${esc(texto)}</button>`).join("");
}

// Archivos adjuntos: imágenes en miniatura y el resto como botones de descarga
export function htmlAdjuntos(refs = [], conImagenes = false) {
  if (!refs.length) return "";
  const imagenes = conImagenes ? refs.filter((r) => /^image\//.test(r.tipo)) : [];
  const otros = refs.filter((r) => !imagenes.includes(r));
  return `${imagenes.length ? `<div class="galeria">${imagenes.map((r) =>
      `<button type="button" class="miniatura" data-descargar="${esc(r.id)}" aria-label="Ver ${esc(r.nombre)}"><img data-img="${esc(r.id)}" alt="${esc(r.nombre)}"></button>`).join("")}</div>` : ""}
    ${otros.length ? `<div class="adjuntos">${otros.map((r) =>
      `<button type="button" class="adjunto" data-descargar="${esc(r.id)}">${icono("archivo")}<span>${esc(r.nombre)}</span><small>${tamano(r.tamano)}</small>${icono("descargar")}</button>`).join("")}</div>` : ""}`;
}

// =============================================================
//  Datos derivados
// =============================================================
export function itemsCalendario(d) {
  const items = [];
  for (const t of d.trabajos) if (t.fecha) items.push({ col: "trabajos", id: t.id, fecha: t.fecha, titulo: t.titulo, clase: t.tipo, asignatura: t.asignatura, hecho: t.estado !== "curso" });
  for (const ev of d.eventos) if (ev.fecha) items.push({ col: "eventos", id: ev.id, fecha: ev.fecha, titulo: ev.titulo, clase: ev.tipo, asignatura: ev.asignatura, hecho: false, nota: ev.nota });
  return items.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
const clasesDelDia = (d, dia) => d.horario.filter((c) => c.dia === dia).sort((a, b) => a.inicio.localeCompare(b.inicio));
const esFestivo = (d, f) => d.eventos.some((ev) => ev.fecha === f && ev.tipo === "Festivo");

function htmlClase(d, c, marcarAhora = false) {
  const a = asigDe(d, c.asignatura);
  let ahora = false;
  if (marcarAhora) { const n = new Date(); const m = n.getHours() * 60 + n.getMinutes(); ahora = m >= aMin(c.inicio) && m < aMin(c.fin); }
  return `<div class="clase ${ahora ? "ahora" : ""}" style="--color:${esc(colorDe(d, c.asignatura))}">
    <span class="hora">${esc(c.inicio)} – ${esc(c.fin)}</span>
    <span><span class="que">${esc(a ? a.nombre : "Clase")}</span><span class="detalle">${[c.aula, c.profe].filter(Boolean).map(esc).join(" · ")}</span></span>
  </div>`;
}

function htmlFechaItem(e, it) {
  const d = e.datos;
  const a = asigDe(d, it.asignatura);
  const f = new Date(it.fecha + "T00:00:00");
  const k = diasHasta(it.fecha);
  const cuando = k === 0 ? "Hoy" : k === 1 ? "Mañana" : k > 1 && k < 7 ? `En ${k} días` : "";
  return `<div class="fecha-item">
    <div class="dia-caja ${claseUrgencia(it.fecha, it.hecho)}"><b>${f.getDate()}</b><small>${esc(f.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""))}</small></div>
    <div class="fecha-texto"><div class="que">${esc(it.titulo)}</div>
      <div class="detalle">${a ? `<span class="punto" style="background:${esc(a.color)}"></span>${esc(nombreSinCodigo(a))} · ` : ""}${esc(it.clase || "")}${cuando ? ` · <b>${cuando}</b>` : ""}${it.nota ? ` · ${esc(it.nota)}` : ""}</div></div>
    ${it.col === "eventos" ? botonesEdicion(e, "eventos", it.id) : ""}
  </div>`;
}

// =============================================================
//  INICIO
// =============================================================
export function vistaInicio(e) {
  const d = e.datos;
  const c = d.config;
  const hoy = new Date();
  const clases = clasesDelDia(d, diaSemana(hoy));
  const bloqueHoy = esFestivo(d, iso(hoy)) ? `<p class="texto-suave">Hoy es festivo: no hay clase.</p>`
    : !clases.length ? `<p class="texto-suave">Hoy no tienes clase.</p>`
    : `<div class="linea-tiempo">${clases.map((x) => htmlClase(d, x, true)).join("")}</div>`;
  const proximas = itemsCalendario(d).filter((i) => diasHasta(i.fecha) >= 0 && !i.hecho).slice(0, 4);
  const avisos = [...d.avisos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 5);
  const posts = [...d.posts].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 3);
  const trabajos = [...d.trabajos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 4);

  const historias = d.asignaturas.map((a) => `<button type="button" class="historia" data-ir="materia/${esc(a.id)}" style="--color:${esc(a.color)}">
      <span class="avatar-anillo"><span class="avatar-in historia-in">${esc(codigo(a) || nombreSinCodigo(a).slice(0, 2))}</span></span>
      <small>${esc(nombreSinCodigo(a))}</small></button>`).join("");
  return `<section class="heroe">
      ${htmlAvatar(d, "heroe-avatar")}
      ${!e.editor && e.quienSoy ? `<p class="saludo-visita">👋 Hola, ${esc(e.quienSoy.nombre)}</p>` : ""}
      <p class="heroe-pre">${esc([c.curso, c.centro].filter(Boolean).join(" · "))}</p>
      <h1>Hola, soy ${esc(c.nombre || "Lorena")}.</h1>
      ${c.descripcion ? `<p class="heroe-sub">${esc(c.descripcion)}</p>` : ""}
      <div class="heroe-chips">
        <span class="pastilla"><i></i>${plural(d.trabajos.length, "trabajo", "trabajos")}</span>
        <span class="pastilla"><i></i>${plural(d.apuntes.length, "tema de apuntes", "temas de apuntes")}</span>
        <span class="pastilla"><i></i>${plural(d.formacion.length, "formación extra", "formaciones extra")}</span>
      </div>
      <div class="heroe-botones">
        <button class="boton oscuro" type="button" data-ir="trabajos">Ver mis trabajos</button>
        <button class="boton blanco" type="button" data-ir="diario">Mi día a día</button>
      </div>
    </section>

    <nav class="historias" aria-label="Materias">${historias}</nav>

    <div class="tarjetas-inicio">
      <section class="panel">
        <div class="panel-titulo"><h2>${icono("reloj")} Hoy · ${esc(mayus(hoy.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })))}</h2>
          <button class="enlace-ver" type="button" data-ir="calendario/horario">Horario ${icono("flecha")}</button></div>
        ${bloqueHoy}
      </section>
      <section class="panel">
        <div class="panel-titulo"><h2>${icono("bandera")} Próximas fechas</h2>
          <button class="enlace-ver" type="button" data-ir="calendario">Calendario ${icono("flecha")}</button></div>
        ${proximas.length ? `<div class="fechas">${proximas.map((i) => htmlFechaItem(e, i)).join("")}</div>` : `<p class="texto-suave">Nada pendiente por ahora.</p>`}
      </section>
      <section class="panel tablon">
        <div class="panel-titulo"><h2>${icono("aviso")} Tablón de clase</h2>
          ${e.editor ? `<button class="enlace-ver" type="button" data-nuevo="avisos">${icono("mas")} Añadir</button>` : ""}</div>
        ${avisos.length ? `<ul class="avisos">${avisos.map((a) => {
          const asig = asigDe(d, a.asignatura);
          return `<li style="--color:${esc(asig ? asig.color : "var(--marca)")}"><div class="texto">${formato(a.texto)}</div>
            <div class="detalle">${a.fecha ? esc(fechaCorta(a.fecha)) : ""}${asig ? ` · ${esc(nombreSinCodigo(asig))}` : ""}${botonesEdicion(e, "avisos", a.id)}</div></li>`;
        }).join("")}</ul>` : `<p class="texto-suave">${e.editor ? "Apunta aquí lo que digan en clase." : "Sin notas por ahora."}</p>`}
      </section>
    </div>

    ${e.editor && comentariosActivos() ? `<section class="bloque-inicio">
      <div class="titulo-bloque"><h2>Quién ha entrado</h2></div>
      ${e.visitas.length ? `<div class="visitas">${e.visitas.slice(0, 12).map((v) => `<div class="visita"><span class="avatar peque">${esc((v.nombre || "?").charAt(0).toUpperCase())}</span>
        <span><b>${esc(v.nombre)}</b><small>${esc(v.rol || "")} · ${esc(new Date(v.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" }))} ${esc(new Date(v.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }))}</small></span></div>`).join("")}</div>`
        : `<p class="texto-suave">Todavía no ha entrado nadie. Cuando alguien entre, verás aquí su nombre.</p>`}
    </section>` : ""}

    <section class="bloque-inicio">
      <div class="titulo-bloque"><h2>Del día a día</h2><button class="enlace-ver" type="button" data-ir="diario">Ver todo ${icono("flecha")}</button></div>
      ${posts.length ? `<div class="posts-mini">${posts.map((p) => `<button class="post-mini" type="button" data-ir="diario/${esc(p.id)}">
          <small>${esc(fechaLarga(p.fecha))}</small><b>${esc(p.titulo)}</b>
          <span>${esc(resumen(p.texto))}</span></button>`).join("")}</div>`
        : vacio(e.editor ? "Todavía no has escrito nada. Empieza en «Día a día»." : "Todavía no hay entradas.")}
    </section>

    <section class="bloque-inicio">
      <div class="titulo-bloque"><h2>Últimos trabajos</h2><button class="enlace-ver" type="button" data-ir="trabajos">Ver todos ${icono("flecha")}</button></div>
      ${trabajos.length ? `<div class="filas">${trabajos.map((t) => htmlFilaTrabajo(e, t, false)).join("")}</div>` : vacio("Todavía no hay trabajos.")}
    </section>`;
}

// =============================================================
//  DÍA A DÍA — estilo Instagram
//  Perfil arriba + destacados + cuadrícula o feed de posts
// =============================================================
const esImagen = (r) => /^image\//.test(r.tipo || "");
const fotosDe = (p) => (p.archivos || []).filter(esImagen);
const tiempoRelativo = (iso) => {
  const k = -diasHasta(iso);
  if (k === 0) return "Hoy";
  if (k === 1) return "Ayer";
  if (k > 1 && k < 7) return `Hace ${k} días`;
  return fechaLarga(iso);
};

// Avatar de la dueña: su foto de perfil (cifrada) o la inicial
export function htmlAvatar(d, clase = "") {
  const foto = (d.config.archivos || []).find(esImagen);
  const inicial = esc((d.config.nombre || "L").charAt(0).toUpperCase());
  return `<span class="avatar-anillo ${clase}"><span class="avatar-in">${foto ? `<img data-img="${esc(foto.id)}" alt="">` : inicial}</span></span>`;
}

export function vistaDiario(e) {
  const d = e.datos;
  const q = normalizar(e.filtros.texto);
  const modo = e.filtros.vista || "feed";
  const etiquetas = [...new Set(d.posts.flatMap((p) => p.etiquetas || []))].sort();
  const lista = [...d.posts]
    .filter((p) => (!e.filtros.etiqueta || (p.etiquetas || []).includes(e.filtros.etiqueta)) &&
      (!q || normalizar(`${p.titulo} ${p.texto} ${(p.etiquetas || []).join(" ")}`).includes(q)))
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const nFotos = d.posts.reduce((n, p) => n + fotosDe(p).length, 0);
  const nComentarios = Object.values(e.comentarios).reduce((n, l) => n + l.filter((c) => c.tipo !== "like").length, 0);

  // Destacados: un círculo por etiqueta, con la foto más reciente que la lleve
  const destacados = etiquetas.map((t) => {
    const conFoto = d.posts.filter((p) => (p.etiquetas || []).includes(t) && fotosDe(p).length)
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))[0];
    const foto = conFoto && fotosDe(conFoto)[0];
    return `<button type="button" class="destacado ${e.filtros.etiqueta === t ? "activo" : ""}" data-filtro="etiqueta" data-valor="${esc(t)}">
      <span class="avatar-anillo"><span class="avatar-in">${foto ? `<img data-img="${esc(foto.id)}" alt="">` : `#`}</span></span>
      <small>${esc(t)}</small></button>`;
  }).join("");

  const perfil = `<section class="perfil-insta">
      ${htmlAvatar(d, "grande")}
      <div class="perfil-datos">
        <div class="perfil-nombre"><h1>${esc(d.config.nombre || "Lorena")}</h1>
          ${e.editor ? `<button class="boton principal" type="button" data-nuevo="posts">${icono("mas")}Nueva publicación</button>
            <button class="boton" type="button" data-accion="perfil">Editar perfil</button>` : ""}</div>
        <ul class="perfil-cifras">
          <li><b>${d.posts.length}</b> ${d.posts.length === 1 ? "publicación" : "publicaciones"}</li>
          <li><b>${nFotos}</b> ${nFotos === 1 ? "foto" : "fotos"}</li>
          ${comentariosActivos() ? `<li><b>${nComentarios}</b> ${nComentarios === 1 ? "comentario" : "comentarios"}</li>` : ""}
        </ul>
        <p class="perfil-bio"><b>${esc([d.config.curso, d.config.centro].filter(Boolean).join(" · "))}</b><br>${esc(d.config.descripcion || "")}</p>
      </div>
    </section>
    ${destacados ? `<div class="destacados">${e.filtros.etiqueta ? `<button type="button" class="destacado" data-filtro="etiqueta" data-valor=""><span class="avatar-anillo gris"><span class="avatar-in">✕</span></span><small>Todas</small></button>` : ""}${destacados}</div>` : ""}`;

  const pestanas = `<div class="pestanas-insta">
      <button type="button" aria-pressed="${modo === "feed"}" data-filtro="vista" data-valor="feed">${icono("diario")} Publicaciones</button>
      <button type="button" aria-pressed="${modo === "cuadricula"}" data-filtro="vista" data-valor="cuadricula">${icono("cuadricula")} Fotos</button>
      <label class="buscador mini">${icono("buscar")}<input type="search" data-buscar placeholder="Buscar…" aria-label="Buscar en el día a día" value="${esc(e.filtros.texto)}"></label>
    </div>`;

  let cuerpo;
  if (!d.posts.length) cuerpo = vacio(e.editor ? "Sube tu primera publicación con «Nueva publicación». Puedes añadir varias fotos." : "Todavía no hay publicaciones.");
  else if (!lista.length) cuerpo = vacio("Nada coincide con la búsqueda.");
  else if (modo === "cuadricula") {
    cuerpo = `<div class="cuadricula">${lista.map((p) => {
      const fotos = fotosDe(p);
      const n = (e.comentarios[p.id] || []);
      const likes = n.filter((c) => c.tipo === "like").length;
      const coms = n.filter((c) => c.tipo !== "like").length;
      return `<button type="button" class="celda ${fotos.length ? "" : "sin-foto"}" data-ver-post="${esc(p.id)}" aria-label="${esc(p.titulo)}">
        ${fotos.length ? `<img data-img="${esc(fotos[0].id)}" alt="">` : `<span class="celda-texto"><b>${esc(p.titulo)}</b></span>`}
        ${fotos.length > 1 ? `<span class="celda-varias">${icono("cuadricula")}</span>` : ""}
        <span class="celda-hover">${likes ? `♥ ${likes}` : ""} ${coms ? `💬 ${coms}` : ""}</span>
      </button>`;
    }).join("")}</div>`;
  } else {
    cuerpo = `<div class="feed">${lista.map((p) => htmlPost(e, p)).join("")}</div>`;
  }
  return `${perfil}${pestanas}${cuerpo}`;
}

function htmlPost(e, p) {
  const d = e.datos;
  const todos = e.comentarios[p.id] || [];
  const likes = todos.filter((c) => c.tipo === "like").length;
  const comentarios = todos.filter((c) => c.tipo !== "like" && (e.editor || !d.comentariosOcultos.includes(c.id)));
  const fotos = fotosDe(p);
  const otros = (p.archivos || []).filter((r) => !esImagen(r));
  const meGusta = e.meGusta.has(p.id);
  const abierto = e.comentariosAbiertos.has(p.id);
  const visibles = abierto ? comentarios : comentarios.slice(-2);

  return `<article class="post-insta" id="post-${esc(p.id)}">
    <header class="post-insta-cab">
      ${htmlAvatar(d, "peque")}
      <div><b>${esc(d.config.nombre || "Lorena")}</b><small>${esc(tiempoRelativo(p.fecha))}${(p.etiquetas || [])[0] ? ` · #${esc(p.etiquetas[0])}` : ""}</small></div>
      ${botonesEdicion(e, "posts", p.id)}
    </header>
    ${fotos.length ? `<div class="carrusel-marco" data-post="${esc(p.id)}">
        <div class="carrusel">${fotos.map((f, i) => `<button type="button" class="diapo" data-ver-foto="${esc(p.id)}:${i}" aria-label="Ver foto ${i + 1}"><img data-img="${esc(f.id)}" alt="${esc(f.nombre)}"></button>`).join("")}</div>
        ${fotos.length > 1 ? `<span class="carrusel-contador">1/${fotos.length}</span>
          <button type="button" class="carrusel-flecha izq" data-carrusel="-1" aria-label="Foto anterior">‹</button>
          <button type="button" class="carrusel-flecha der" data-carrusel="1" aria-label="Foto siguiente">›</button>` : ""}
        <span class="corazon-grande" aria-hidden="true">♥</span>
      </div>
      ${fotos.length > 1 ? `<div class="puntos-carrusel">${fotos.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>` : ""}` : ""}
    <div class="post-insta-cuerpo">
      ${comentariosActivos() ? `<div class="acciones-insta">
        <button type="button" class="accion-insta ${meGusta ? "rojo" : ""}" data-like="${esc(p.id)}" aria-label="Me gusta" aria-pressed="${meGusta}">${meGusta ? "♥" : "♡"}</button>
        <button type="button" class="accion-insta" data-foco-comentario="${esc(p.id)}" aria-label="Comentar">${icono("comentario")}</button>
      </div>
      ${likes ? `<p class="likes"><b>${likes} ${likes === 1 ? "me gusta" : "me gusta"}</b></p>` : ""}` : ""}
      <h2 class="post-insta-titulo">${esc(p.titulo)}</h2>
      <div class="texto">${formato(p.texto)}</div>
      ${(p.etiquetas || []).length ? `<p class="hashtags">${p.etiquetas.map((t) => `<button type="button" data-filtro="etiqueta" data-valor="${esc(t)}">#${esc(t)}</button>`).join(" ")}</p>` : ""}
      ${otros.length ? htmlAdjuntos(otros) : ""}
      ${comentariosActivos() ? `<div class="comentarios-insta">
        ${comentarios.length > 2 && !abierto ? `<button type="button" class="ver-comentarios" data-ver-comentarios="${esc(p.id)}">Ver los ${comentarios.length} comentarios</button>` : ""}
        ${visibles.map((c) => {
          const oculto = d.comentariosOcultos.includes(c.id);
          return `<p class="comentario-insta ${oculto ? "oculto" : ""}"><b>${esc(c.nombre)}</b>${c.rol ? ` <span class="rol">${esc(c.rol)}</span>` : ""} ${esc(c.texto)}
            ${e.editor ? `<button type="button" class="enlace-ver" data-ocultar-comentario="${esc(c.id)}">${oculto ? "Mostrar" : "Ocultar"}</button>` : ""}</p>`;
        }).join("")}
        ${htmlFormComentario(e, p.id)}
      </div>` : ""}
      <time class="post-insta-fecha">${esc(fechaLarga(p.fecha))}</time>
    </div>
  </article>`;
}

function htmlFormComentario(e, idPost) {
  const yo = e.quienSoy;
  return `<form class="form-comentario-insta" data-comentar="${esc(idPost)}">
    ${yo ? "" : `<div class="quien-eres"><input name="nombre" required maxlength="60" placeholder="Tu nombre" aria-label="Tu nombre">
      <select name="rol" aria-label="Eres"><option>Profesor/a</option><option>Compañero/a</option><option>Familia</option><option>Otro</option></select></div>`}
    <div class="fila-comentar-insta">
      <input name="texto" required maxlength="2000" placeholder="${yo ? `Comentar como ${esc(yo.nombre)}…` : "Añade un comentario…"}" aria-label="Comentario" id="comentar-${esc(idPost)}">
      <button type="submit">Publicar</button>
    </div>
    ${yo ? `<button type="button" class="enlace-ver cambiar-nombre" data-cambiar-nombre>No soy ${esc(yo.nombre)}</button>` : ""}
  </form>`;
}

// =============================================================
//  MATERIAS
// =============================================================
export function vistaMaterias(e) {
  const d = e.datos;
  return `${cabecera("Materias", "Apuntes, trabajos e información de cada asignatura.", botonAnadir(e, "asignaturas", "Nueva materia"))}
    <div class="materias">${d.asignaturas.map((a) => {
      const nApuntes = d.apuntes.filter((x) => x.asignatura === a.id).length;
      const nTrabajos = d.trabajos.filter((x) => x.asignatura === a.id).length;
      const clases = d.horario.filter((c) => c.asignatura === a.id).sort((x, y) => x.dia - y.dia);
      const profe = a.profe || clases.find((c) => c.profe)?.profe || "";
      return `<button type="button" class="materia" data-ir="materia/${esc(a.id)}" style="--color:${esc(a.color)}">
        <span class="materia-banda">${codigo(a) ? `<span>${esc(codigo(a))}</span>` : ""}</span>
        <b>${esc(nombreSinCodigo(a))}</b>
        ${profe ? `<small>${esc(profe)}</small>` : ""}
        <span class="materia-cifras"><span>${nApuntes} apuntes</span><span>${nTrabajos} trabajos</span>${clases.length ? `<span>${clases.map((c) => DIAS[c.dia - 1].slice(0, 3)).join(", ")}</span>` : ""}</span>
      </button>`;
    }).join("")}</div>`;
}

export function vistaMateria(e, id, pestana = "apuntes") {
  const d = e.datos;
  const a = asigDe(d, id);
  if (!a) return vacio("Esta materia no existe.");
  const apuntes = d.apuntes.filter((x) => x.asignatura === id);
  const q = normalizar(e.filtros.texto);
  const apuntesFiltrados = apuntes.filter((x) => !q || normalizar(`${x.titulo} ${x.texto}`).includes(q))
    .sort((x, y) => (y.fecha || "").localeCompare(x.fecha || ""));
  const trabajos = d.trabajos.filter((x) => x.asignatura === id);
  const clases = d.horario.filter((c) => c.asignatura === id).sort((x, y) => x.dia - y.dia || x.inicio.localeCompare(y.inicio));
  const profe = a.profe || clases.find((c) => c.profe)?.profe || "";
  const usos = apuntes.length + trabajos.length + clases.length + d.eventos.filter((x) => x.asignatura === id).length;

  let cuerpo;
  if (pestana === "trabajos") {
    cuerpo = `<div class="barra-acciones">${botonAnadir(e, "trabajos", "Añadir trabajo", `asignatura=${id}`)}</div>
      ${trabajos.length ? `<div class="filas">${trabajos.sort((x, y) => (y.fecha || "").localeCompare(x.fecha || "")).map((t) => htmlFilaTrabajo(e, t)).join("")}</div>` : vacio("Todavía no hay trabajos de esta materia.")}`;
  } else if (pestana === "info") {
    cuerpo = `<div class="info-materia">
      <section class="panel texto">${a.descripcion ? formato(a.descripcion) : `<p class="texto-suave">${e.editor ? "Pulsa «Editar materia» para añadir la información y la teoría general." : "Sin información todavía."}</p>`}</section>
      <aside class="panel"><div class="panel-titulo"><h2>${icono("reloj")} Clases</h2></div>
        ${clases.length ? `<div class="linea-tiempo">${clases.map((c) => `<div class="clase" style="--color:${esc(a.color)}"><span class="hora">${esc(DIAS[c.dia - 1])}</span><span><span class="que">${esc(c.inicio)} – ${esc(c.fin)}</span><span class="detalle">${[c.aula, c.profe].filter(Boolean).map(esc).join(" · ")}</span></span></div>`).join("")}</div>` : `<p class="texto-suave">No está en el horario.</p>`}
      </aside></div>`;
  } else {
    cuerpo = `<div class="filtros">${buscador(e, "Buscar en los apuntes…")}${botonAnadir(e, "apuntes", "Añadir apuntes", `asignatura=${id}`)}</div>
      ${!apuntes.length ? vacio(e.editor ? "Añade aquí lo que os den en clase para poder estudiar." : "Todavía no hay apuntes.")
        : !apuntesFiltrados.length ? vacio("Nada coincide con la búsqueda.")
        : `<div class="apuntes">${apuntesFiltrados.map((x, i) => `<details class="apunte" ${i === 0 || q ? "open" : ""}>
            <summary><span><b>${esc(x.titulo)}</b><small>${x.fecha ? esc(fechaLarga(x.fecha)) : ""}${(x.archivos || []).length ? ` · ${x.archivos.length} archivo${x.archivos.length > 1 ? "s" : ""}` : ""}</small></span>${botonesEdicion(e, "apuntes", x.id)}</summary>
            <div class="texto">${formato(x.texto)}</div>
            ${x.enlace ? `<a class="enlace-icono" href="${esc(x.enlace)}" target="_blank" rel="noopener">${icono("web")} Abrir enlace</a>` : ""}
            ${htmlAdjuntos(x.archivos, true)}
          </details>`).join("")}</div>`}`;
  }

  const tab = (clave, texto, n) => `<button type="button" class="segmento" aria-pressed="${pestana === clave}" data-ir="materia/${esc(id)}/${clave}">${texto}${n !== undefined ? ` <span>${n}</span>` : ""}</button>`;
  return `<button type="button" class="volver" data-ir="materias">← Todas las materias</button>
    <header class="materia-cab" style="--color:${esc(a.color)}">
      <div>${codigo(a) ? `<span class="codigo">${esc(codigo(a))}</span>` : ""}<h1>${esc(nombreSinCodigo(a))}</h1>${profe ? `<p>${esc(profe)}</p>` : ""}</div>
      ${e.editor ? `<div class="cab-der"><button class="boton blanco" type="button" data-editar="asignaturas:${esc(id)}">${icono("editar")} Editar materia</button>
        ${usos ? "" : `<button class="boton blanco" type="button" data-borrar="asignaturas:${esc(id)}">${icono("borrar")}</button>`}
        ${e.borrando === `asignaturas:${id}` ? botonesEdicion(e, "asignaturas", id) : ""}</div>` : ""}
    </header>
    <div class="segmentos">${tab("apuntes", "Apuntes", apuntes.length)}${tab("trabajos", "Trabajos", trabajos.length)}${tab("info", "Información")}</div>
    ${cuerpo}`;
}

// =============================================================
//  TRABAJOS
// =============================================================
function htmlFilaTrabajo(e, t, conEdicion = true) {
  const d = e.datos;
  const a = asigDe(d, t.asignatura);
  const est = ESTADOS.find((x) => x.id === t.estado) || ESTADOS[0];
  const hecho = t.estado !== "curso";
  return `<article class="fila" style="--color:${esc(colorDe(d, t.asignatura))}">
    <span class="barra"></span>
    <div class="fila-cuerpo">
      <h3>${esc(t.titulo)}</h3>
      <div class="etiquetas">
        ${a ? `<span class="etiqueta">${esc(nombreSinCodigo(a))}</span>` : ""}
        <span class="etiqueta">${esc(t.tipo || "Otro")}</span>
        <span class="etiqueta e-${esc(est.id)}">${esc(est.nombre)}</span>
        ${t.fecha ? `<span class="etiqueta fecha ${claseUrgencia(t.fecha, hecho)}">${esc(fechaCorta(t.fecha))}</span>` : ""}
        ${t.nota ? `<span class="etiqueta nota">Nota ${esc(t.nota)}</span>` : ""}
      </div>
      ${t.descripcion ? `<div class="texto pequeno">${formato(t.descripcion)}</div>` : ""}
      ${htmlAdjuntos(t.archivos)}
    </div>
    <div class="fila-der">
      ${/^https?:\/\//i.test(t.enlace || "") ? `<a class="enlace-icono" href="${esc(t.enlace)}" target="_blank" rel="noopener">${icono("web")} Abrir</a>` : ""}
      ${conEdicion ? botonesEdicion(e, "trabajos", t.id) : ""}
    </div>
  </article>`;
}

export function vistaTrabajos(e) {
  const d = e.datos;
  const q = normalizar(e.filtros.texto);
  const usadas = new Set(d.trabajos.map((t) => t.asignatura));
  const lista = d.trabajos.filter((t) =>
    (!e.filtros.asignatura || t.asignatura === e.filtros.asignatura) &&
    (!e.filtros.estado || t.estado === e.filtros.estado) &&
    (!q || normalizar(`${t.titulo} ${t.descripcion || ""} ${t.tipo}`).includes(q)));

  let html = "";
  const grupos = new Map(d.asignaturas.map((a) => [a.id, []]));
  grupos.set("", []);
  for (const t of lista) (grupos.get(t.asignatura) || grupos.get("")).push(t);
  for (const [id, ts] of grupos) {
    if (!ts.length) continue;
    const a = asigDe(d, id);
    ts.sort((x, y) => (y.fecha || "").localeCompare(x.fecha || ""));
    html += `<section class="grupo"><div class="grupo-cabecera">${a ? `<span class="punto" style="background:${esc(a.color)}"></span>` : ""}
      <h2>${esc(a ? a.nombre : "Otros")}</h2><span class="cuenta">${ts.length}</span></div>
      <div class="filas">${ts.map((t) => htmlFilaTrabajo(e, t)).join("")}</div></section>`;
  }
  return `${cabecera("Trabajos", "Todo lo que he hecho en el ciclo, por materia.", botonAnadir(e, "trabajos", "Añadir trabajo"))}
    <div class="filtros">${buscador(e, "Buscar trabajo…")}
      ${chips([["", "Todos"], ...ESTADOS.map((x) => [x.id, x.nombre])], e.filtros.estado || "", "estado")}</div>
    <div class="filtros">${chips([["", "Todas las materias"], ...d.asignaturas.filter((a) => usadas.has(a.id)).map((a) => [a.id, nombreSinCodigo(a), a.color])], e.filtros.asignatura || "", "asignatura")}</div>
    ${!d.trabajos.length ? vacio("Todavía no hay trabajos.") : html || vacio("Ningún trabajo coincide con el filtro.")}`;
}

// =============================================================
//  FORMACIÓN EXTRA (Cisco, titulaciones…)
// =============================================================
export function vistaFormacion(e) {
  const d = e.datos;
  const lista = d.formacion.filter((f) => !e.filtros.estado || f.estado === e.filtros.estado)
    .sort((a, b) => (b.inicio || "").localeCompare(a.inicio || ""));
  const horas = d.formacion.filter((f) => f.estado === "Completado").reduce((s, f) => s + (Number(f.horas) || 0), 0);
  return `${cabecera("Formación", "Cursos, certificaciones y titulaciones fuera del ciclo.", botonAnadir(e, "formacion", "Añadir formación"))}
    ${d.formacion.length ? `<div class="cifras">
      <div class="cifra destacada"><b>${d.formacion.filter((f) => f.estado === "Completado").length}</b><span>Completadas</span></div>
      <div class="cifra"><b>${d.formacion.filter((f) => f.estado === "En curso").length}</b><span>En curso</span></div>
      <div class="cifra"><b>${horas}</b><span>Horas completadas</span></div>
    </div>` : ""}
    <div class="filtros">${chips([["", "Todas"], ...ESTADOS_FORMACION.map((x) => [x, x])], e.filtros.estado || "", "estado")}</div>
    ${!d.formacion.length ? vacio(e.editor ? "Añade tus cursos de Cisco, certificaciones o titulaciones." : "Todavía no hay formación añadida.")
      : !lista.length ? vacio("Nada con este estado.")
      : `<div class="formaciones">${lista.map((f) => `<article class="formacion">
        <div class="formacion-cab">
          <span class="etiqueta">${esc(f.tipo || "Curso")}</span>
          <span class="etiqueta ${f.estado === "Completado" ? "e-entregado" : f.estado === "En curso" ? "e-curso" : ""}">${esc(f.estado || "")}</span>
          ${botonesEdicion(e, "formacion", f.id)}
        </div>
        <h3>${esc(f.titulo)}</h3>
        ${f.entidad ? `<p class="entidad">${esc(f.entidad)}</p>` : ""}
        <p class="texto-suave">${[f.inicio && fechaCorta(f.inicio), f.fin && `→ ${fechaCorta(f.fin)}`, f.horas && `${f.horas} h`].filter(Boolean).map(esc).join(" ")}</p>
        ${f.notas ? `<div class="texto pequeno">${formato(f.notas)}</div>` : ""}
        ${f.enlace ? `<a class="enlace-icono" href="${esc(f.enlace)}" target="_blank" rel="noopener">${icono("web")} Ver credencial</a>` : ""}
        ${htmlAdjuntos(f.archivos)}
      </article>`).join("")}</div>`}`;
}

// =============================================================
//  CALENDARIO + HORARIO
// =============================================================
export function vistaCalendario(e, modo = "mes") {
  const seg = (clave, texto) => `<button type="button" class="segmento" aria-pressed="${modo === clave}" data-ir="calendario${clave === "mes" ? "" : "/" + clave}">${texto}</button>`;
  const derecha = modo === "horario" ? botonAnadir(e, "horario", "Añadir clase") : botonAnadir(e, "eventos", "Añadir fecha");
  return `${cabecera("Calendario", "Entregas, exámenes, festivos y mi horario de clases.", derecha)}
    <div class="segmentos">${seg("mes", "Mes")}${seg("horario", "Horario semanal")}</div>
    ${modo === "horario" ? htmlHorario(e) : `<div class="calendario-zona">
      <div class="panel">${htmlMes(e)}</div>
      <aside class="agenda">${htmlAgenda(e)}</aside>
    </div>`}`;
}

function htmlMes(e) {
  const d = e.datos;
  const { anio, mes, dia: sel } = e.cal;
  const porDia = new Map();
  for (const it of itemsCalendario(d)) { if (!porDia.has(it.fecha)) porDia.set(it.fecha, []); porDia.get(it.fecha).push(it); }
  const primero = new Date(anio, mes, 1);
  const inicio = new Date(primero); inicio.setDate(1 - (diaSemana(primero) - 1));
  const hoy = iso(new Date());
  let celdas = ["L", "M", "X", "J", "V", "S", "D"].map((x) => `<div class="cal-dia-semana">${x}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const f = new Date(inicio); f.setDate(inicio.getDate() + i);
    const clave = iso(f);
    const cosas = porDia.get(clave) || [];
    const clases = [f.getMonth() !== mes ? "fuera" : "", clave === hoy ? "hoy" : "", diaSemana(f) > 5 ? "finde" : ""].join(" ");
    celdas += `<button type="button" class="cal-dia ${clases}" aria-pressed="${clave === sel}" data-dia="${clave}"
      aria-label="${esc(f.toLocaleDateString("es-ES", { day: "numeric", month: "long" }))}${cosas.length ? `, ${cosas.length} cosas` : ""}">
      <span class="num">${f.getDate()}</span>
      <span class="cal-cosas">${cosas.slice(0, 2).map((c) => `<span class="cal-cosa" style="--color:${esc(colorDe(d, c.asignatura))}">${esc(c.titulo)}</span>`).join("")}${cosas.length > 2 ? `<span class="cal-mas">+${cosas.length - 2}</span>` : ""}</span>
      <span class="puntos">${cosas.slice(0, 5).map((c) => `<span class="punto" style="background:${esc(colorDe(d, c.asignatura))}"></span>`).join("")}</span></button>`;
  }
  return `<div class="cal-cabecera">
      <button type="button" class="boton icono" data-mes="-1" aria-label="Mes anterior">←</button>
      <h2>${esc(mayus(primero.toLocaleDateString("es-ES", { month: "long" })))} ${anio}</h2>
      <button type="button" class="boton icono" data-mes="1" aria-label="Mes siguiente">→</button>
    </div><div class="cal-rejilla">${celdas}</div>`;
}

function htmlAgenda(e) {
  const d = e.datos;
  const sel = e.cal.dia;
  const items = itemsCalendario(d);
  if (sel) {
    const f = new Date(sel + "T00:00:00");
    const delDia = items.filter((i) => i.fecha === sel);
    const clases = esFestivo(d, sel) ? [] : clasesDelDia(d, diaSemana(f));
    return `<section class="panel">
        <div class="panel-titulo"><h2>${esc(mayus(f.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })))}</h2>
          <button class="enlace-ver" type="button" data-dia="">Cerrar</button></div>
        ${delDia.length ? `<div class="fechas">${delDia.map((i) => htmlFechaItem(e, i)).join("")}</div>` : `<p class="texto-suave">Sin entregas ni exámenes.</p>`}
        ${e.editor ? `<button class="boton peque" type="button" data-nuevo="eventos" data-preset="fecha=${sel}" style="margin-top:12px">${icono("mas")} Añadir fecha este día</button>` : ""}
      </section>
      ${clases.length ? `<section class="panel"><div class="panel-titulo"><h2>${icono("reloj")} Clases</h2></div>
        <div class="linea-tiempo">${clases.map((c) => htmlClase(d, c)).join("")}</div></section>` : ""}`;
  }
  const proximas = items.filter((i) => diasHasta(i.fecha) >= 0).slice(0, 8);
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Próximas fechas</h2></div>
    ${proximas.length ? `<div class="fechas">${proximas.map((i) => htmlFechaItem(e, i)).join("")}</div>` : `<p class="texto-suave">No hay fechas próximas.</p>`}</section>`;
}

function htmlHorario(e) {
  const d = e.datos;
  if (!d.horario.length) return vacio("Todavía no hay horario.");
  const hoy = diaSemana(new Date());
  const desde = Math.floor(Math.min(...d.horario.map((c) => aMin(c.inicio))) / 60);
  const hasta = Math.ceil(Math.max(...d.horario.map((c) => aMin(c.fin))) / 60);
  const pos = (h) => ((aMin(h) - desde * 60) / 60).toFixed(3);

  let rejilla = `<div></div>` + DIAS.map((n, i) => `<div class="cab ${hoy === i + 1 ? "hoy" : ""}">${esc(n)}</div>`).join("");
  rejilla += `<div class="horas">${Array.from({ length: hasta - desde + 1 }, (_, i) => `<span style="top:calc(${i} * var(--alto-hora))">${String(desde + i).padStart(2, "0")}:00</span>`).join("")}</div>`;
  for (let dia = 1; dia <= 5; dia++) {
    rejilla += `<div class="columna ${hoy === dia ? "hoy" : ""}">${clasesDelDia(d, dia).map((c) => {
      const a = asigDe(d, c.asignatura);
      const estilo = `--color:${esc(colorDe(d, c.asignatura))};top:calc(${pos(c.inicio)} * var(--alto-hora));height:calc((${pos(c.fin)} - ${pos(c.inicio)}) * var(--alto-hora) - 4px)`;
      const dentro = `<span class="que">${esc(a ? nombreSinCodigo(a) : "Clase")}</span><span class="hora">${esc(c.inicio)}–${esc(c.fin)}</span><span class="detalle">${[c.aula, c.profe].filter(Boolean).map(esc).join(" · ")}</span>`;
      return e.editor
        ? `<button type="button" class="bloque" style="${estilo}" data-editar="horario:${esc(c.id)}" aria-label="Editar clase">${dentro}</button>`
        : `<div class="bloque" style="${estilo}">${dentro}</div>`;
    }).join("")}</div>`;
  }
  const lista = DIAS.map((n, i) => {
    const clases = clasesDelDia(d, i + 1);
    return `<section class="panel"><h3>${esc(n)}${hoy === i + 1 ? ` <span class="hoy-marca">Hoy</span>` : ""}</h3>
      ${clases.length ? `<div class="linea-tiempo">${clases.map((c) => e.editor
        ? `<div class="con-edicion">${htmlClase(d, c, hoy === i + 1)}${botonesEdicion(e, "horario", c.id)}</div>` : htmlClase(d, c, hoy === i + 1)).join("")}</div>` : `<p class="texto-suave">Sin clase</p>`}</section>`;
  }).join("");
  return `${e.editor ? `<p class="nota">Pulsa una clase para editarla.</p>` : ""}
    <div class="horario-rejilla" style="--horas:${hasta - desde}">${rejilla}</div><div class="horario-lista">${lista}</div>`;
}
