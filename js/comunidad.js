// =============================================================
//  comunidad.js — Foro (consejos, preguntas, recursos…) y buzón privado
//
//  FORO: cada tema se cifra con la clave de su público:
//    "todos" (lo leen todos los grupos) o "familia" / "profes" / "amigos".
//    Cada grupo solo recibe su clave y la de "todos".
//  BUZÓN: los mensajes se cifran con la CLAVE PÚBLICA de Lorena (RSA-OAEP).
//    Solo el modo edición tiene la clave privada: nadie más puede leerlos.
// =============================================================
import { esc, nuevoId, aB64, deB64, claveAleatoria, cifrarConClave, descifrarConClave } from "./comun.js";
import { icono } from "./iconos.js";
import * as sb from "./comentarios.js";
import { GRUPOS, grupoDe } from "./grupos.js";

export const CATEGORIAS = [
  ["consejos", "Consejos", "bombilla"],
  ["preguntas", "Preguntas", "pregunta"],
  ["recursos", "Recursos", "enlace"],
  ["sugerencias", "Sugerencias", "chispa"],
];
const catDe = (id) => CATEGORIAS.find((c) => c[0] === id) || CATEGORIAS[0];
const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- Claves ----------
export async function crearClavesComunidad(c) {
  let nuevas = false;
  if (!c.foro) {
    c.foro = { todos: claveAleatoria(), ...Object.fromEntries(GRUPOS.map((g) => [g.id, claveAleatoria()])) };
    nuevas = true;
  }
  if (!c.buzon) {
    const par = await crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]);
    c.buzon = { publica: await crypto.subtle.exportKey("jwk", par.publicKey), privada: await crypto.subtle.exportKey("jwk", par.privateKey) };
    nuevas = true;
  }
  return nuevas;
}

// Claves que tiene quien está usando la app: { foro: {todos, familia…}, buzonPublica, buzonPrivada }
export function clavesDe(ctx, datos) {
  if (ctx.clavesComunidad) return ctx.clavesComunidad; // visitante de un grupo
  const c = datos.config.claves || {};
  return { foro: c.foro || {}, buzonPublica: c.buzon?.publica, buzonPrivada: ctx.editor ? c.buzon?.privada : null };
}

// ---------- Foro: leer y escribir ----------
export async function cargarForo(claves) {
  const filas = await sb.leerFilas("_foro", 2000);
  const temas = [];
  const respuestas = new Map();
  for (const f of filas) {
    const k = claves.foro?.[f.datos?.k];
    if (!k) continue;
    try {
      const x = JSON.parse(dec.decode(await descifrarConClave(f.datos, k)));
      x.fecha = f.creado; x.publico = f.datos.k; x.fila = f.id;
      if (x.tipo === "tema") temas.push(x);
      else if (x.tipo === "respuesta") { if (!respuestas.has(x.tema)) respuestas.set(x.tema, []); respuestas.get(x.tema).push(x); }
    } catch { /* no es para mí */ }
  }
  return { temas: temas.reverse(), respuestas };
}

async function publicarForo(obj, publico, claves) {
  const k = claves.foro?.[publico];
  if (!k) throw new Error("No tienes permiso para publicar ahí.");
  const cifrado = await cifrarConClave(enc.encode(JSON.stringify({ ...obj, disp: sb.dispositivo() })), k);
  await sb.insertarFila("_foro", { k: publico, ...cifrado });
}

// ---------- Buzón ----------
async function importarPublica(jwk) { return crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]); }
async function importarPrivada(jwk) { return crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]); }

export async function enviarBuzon(mensaje, jwkPublica) {
  if (!jwkPublica) throw new Error("El buzón aún no está preparado.");
  const clave = claveAleatoria();
  const cifrado = await cifrarConClave(enc.encode(JSON.stringify({ ...mensaje, disp: sb.dispositivo() })), clave);
  const k = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, await importarPublica(jwkPublica), deB64(clave));
  await sb.insertarFila("_buzon", { v: "rsa", k: aB64(k), ...cifrado });
}

export async function cargarBuzon(jwkPrivada) {
  if (!jwkPrivada) return [];
  const privada = await importarPrivada(jwkPrivada);
  const lista = [];
  for (const f of await sb.leerFilas("_buzon", 1000)) {
    try {
      const clave = aB64(await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privada, deB64(f.datos.k)));
      lista.push({ id: f.id, fecha: f.creado, ...JSON.parse(dec.decode(await descifrarConClave(f.datos, clave))) });
    } catch { /* ignorar */ }
  }
  return lista.reverse();
}

// ---------- Utilidades de vista ----------
const hace = (f) => {
  const s = (Date.now() - new Date(f)) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "ayer";
  if (s < 604800) return `hace ${Math.floor(s / 86400)} días`;
  return new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};
const iniciales = (n = "?") => n.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
const colorAvatar = (rol = "") => /profe/i.test(rol) ? "v" : /famil/i.test(rol) ? "m" : /amig|compa/i.test(rol) ? "n" : "";
export const avatar = (nombre, rol, peque = false) => `<span class="avatar ${peque ? "p" : ""} ${colorAvatar(rol)}">${esc(iniciales(nombre))}</span>`;
const chipRol = (rol) => rol ? `<span class="chip ${/profe/i.test(rol) ? "acento" : ""}">${esc(rol)}</span>` : "";
const chipPublico = (p) => p === "todos" ? "" : `<span class="chip aviso">${icono("candado")}Solo ${esc(grupoDe(p)?.nombre || p)}</span>`;

function opcionesPublico(e, claves) {
  const disponibles = ["todos", ...GRUPOS.map((g) => g.id)].filter((p) => claves.foro?.[p]);
  return disponibles.map((p) => `<option value="${p}">${p === "todos" ? "Todos" : `Solo ${grupoDe(p).nombre}`}</option>`).join("");
}

// ---------- Vista: lista del foro ----------
export function vistaComunidad(e, claves) {
  const d = e.datos;
  const f = e.foro;
  const cat = e.filtros.categoria || "";
  const puedeModerar = e.editor;
  const visibles = (f?.temas || []).filter((t) => (puedeModerar || !d.foro.ocultos.includes(t.id)) && (!cat || t.categoria === cat));
  visibles.sort((a, b) => (d.foro.fijados.includes(b.id) - d.foro.fijados.includes(a.id)) || b.fecha.localeCompare(a.fecha));
  const nResp = (id) => (f?.respuestas.get(id) || []).filter((r) => puedeModerar || !d.foro.ocultos.includes(r.id)).length;

  const pest = (id, txt) => `<button type="button" class="pestana ${cat === id ? "on" : ""}" data-filtro="categoria" data-valor="${id}">${txt}</button>`;
  const nuevo = e.foroNuevo ? `<form class="panel form-tema" data-form="foro-tema">
      <div class="rejilla-form">
        <div class="campo ancho"><label for="tTitulo">Título</label><input id="tTitulo" name="titulo" required maxlength="140" placeholder="p. ej. Cómo organizarse las prácticas"></div>
        <div class="campo"><label for="tCat">Categoría</label><select id="tCat" name="categoria">${CATEGORIAS.map(([id, t]) => `<option value="${id}" ${cat === id ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="campo"><label for="tPub">Quién lo ve</label><select id="tPub" name="publico">${opcionesPublico(e, claves)}</select></div>
        <div class="campo ancho"><label for="tTexto">Mensaje</label><textarea id="tTexto" name="texto" required maxlength="4000" rows="4"></textarea></div>
      </div>
      <div class="fila-botones"><button type="button" class="boton" data-accion="foro-nuevo">Cancelar</button><button class="boton principal" type="submit">Publicar tema</button></div>
    </form>` : "";

  const lista = !sb.activos() ? `<div class="vacio">La comunidad necesita Supabase configurado.</div>`
    : !f ? `<div class="vacio">Cargando…</div>`
    : !visibles.length ? `<div class="vacio">Todavía no hay temas${cat ? " en esta categoría" : ""}. ¡Abre el primero!</div>`
    : `<div class="hilos">${visibles.map((t) => `<button type="button" class="hilo ${d.foro.ocultos.includes(t.id) ? "oculto" : ""}" data-ir="comunidad/${esc(t.id)}">
        ${avatar(t.nombre, t.rol)}
        <span class="hilo-txt"><b>${esc(t.titulo)}</b>
          <span class="meta">${d.foro.fijados.includes(t.id) ? `<span class="chip fijo">Fijado</span>` : ""}${d.foro.cerrados.includes(t.id) ? `<span class="chip">Cerrado</span>` : ""}
            ${chipRol(t.rol)}${puedeModerar ? chipPublico(t.publico) : ""}<span>${esc(t.nombre)} · ${esc(catDe(t.categoria)[1])} · ${hace(t.fecha)}</span></span></span>
        <span class="resp"><b>${nResp(t.id)}</b>${nResp(t.id) === 1 ? "respuesta" : "respuestas"}</span>
      </button>`).join("")}</div>`;

  const cuentas = CATEGORIAS.map(([id, t, ic]) => `<button type="button" class="cat" data-filtro="categoria" data-valor="${id}"><b>${icono(ic)}${t}</b>
      <small>${(f?.temas || []).filter((x) => x.categoria === id && !d.foro.ocultos.includes(x.id)).length} temas</small></button>`).join("");

  return `<header class="cabecera-seccion"><div><h1>Comunidad</h1><p>Consejos, preguntas y recursos para el curso.</p></div>
      <div class="cab-der"><button class="boton principal" type="button" data-accion="foro-nuevo">${icono("mas")} Nuevo tema</button></div></header>
    <div class="pestanas">${pest("", "Todo")}${CATEGORIAS.map(([id, t]) => pest(id, t)).join("")}</div>
    ${nuevo}
    <div class="rejilla-comunidad">
      <section class="panel">${lista}</section>
      <div class="columna">
        ${htmlTarjetaBuzon(e, claves)}
        <section class="panel"><div class="panel-titulo"><h2>${icono("comentario")} Categorías</h2></div><div class="categorias">${cuentas}</div></section>
      </div>
    </div>`;
}

// ---------- Vista: un tema ----------
export function vistaTema(e, id, claves) {
  const d = e.datos;
  const t = e.foro?.temas.find((x) => x.id === id);
  if (!e.foro) return `<div class="vacio">Cargando…</div>`;
  if (!t || (!e.editor && d.foro.ocultos.includes(id))) return `<button type="button" class="volver" data-ir="comunidad">${icono("flecha-izq")} Comunidad</button><div class="vacio">Este tema no existe o no tienes acceso.</div>`;
  const resp = (e.foro.respuestas.get(id) || []).filter((r) => e.editor || !d.foro.ocultos.includes(r.id));
  const cerrado = d.foro.cerrados.includes(id);
  const mod = (clave, txt, idx = id) => `<button type="button" class="boton peque" data-accion="foro-mod" data-que="${clave}" data-id="${esc(idx)}">${txt}</button>`;
  return `<button type="button" class="volver" data-ir="comunidad">${icono("flecha-izq")} Comunidad</button>
    <article class="panel tema">
      <header class="tema-cab">${avatar(t.nombre, t.rol)}<div><b>${esc(t.nombre)}</b> ${chipRol(t.rol)}<small class="texto-suave">${esc(catDe(t.categoria)[1])} · ${hace(t.fecha)}</small></div>
        <span class="tema-chips">${d.foro.fijados.includes(id) ? `<span class="chip fijo">Fijado</span>` : ""}${cerrado ? `<span class="chip">Cerrado</span>` : ""}${e.editor ? chipPublico(t.publico) : ""}</span></header>
      <h1>${esc(t.titulo)}</h1>
      <div class="texto">${esc(t.texto).replace(/\n/g, "<br>")}</div>
      ${e.editor ? `<div class="fila-botones moderar">${mod("fijados", d.foro.fijados.includes(id) ? "Desfijar" : "Fijar")}${mod("cerrados", cerrado ? "Reabrir" : "Cerrar")}${mod("ocultos", d.foro.ocultos.includes(id) ? "Mostrar" : "Ocultar")}</div>` : ""}
    </article>
    <section class="respuestas">${resp.map((r) => `<div class="respuesta ${d.foro.ocultos.includes(r.id) ? "oculto" : ""}">${avatar(r.nombre, r.rol, true)}
        <div><div class="r-cab"><b>${esc(r.nombre)}</b> ${chipRol(r.rol)}<small class="texto-suave">${hace(r.fecha)}</small>
          ${e.editor ? `<button type="button" class="enlace-ver" data-accion="foro-mod" data-que="ocultos" data-id="${esc(r.id)}">${d.foro.ocultos.includes(r.id) ? "Mostrar" : "Ocultar"}</button>` : ""}</div>
        <div class="texto">${esc(r.texto).replace(/\n/g, "<br>")}</div></div></div>`).join("")}</section>
    ${cerrado ? `<p class="texto-suave">Este tema está cerrado.</p>` : `<form class="panel form-respuesta" data-form="foro-respuesta">
      <input type="hidden" name="tema" value="${esc(id)}"><input type="hidden" name="publico" value="${esc(t.publico)}">
      <textarea name="texto" required maxlength="4000" rows="3" placeholder="Escribe una respuesta…" aria-label="Respuesta"></textarea>
      <div class="fila-botones"><button class="boton principal" type="submit">Responder</button></div></form>`}`;
}

// ---------- Buzón ----------
function htmlTarjetaBuzon(e, claves) {
  if (e.editor) {
    const nuevos = (e.buzon || []).filter((m) => !e.datos.buzonLeidos.includes(m.id)).length;
    return `<section class="panel buzon"><div class="panel-titulo"><h2>${icono("buzon")} Buzón privado</h2>${nuevos ? `<span class="chip acento">${nuevos} ${nuevos === 1 ? "nuevo" : "nuevos"}</span>` : ""}</div>
      <p>Mensajes que solo puedes leer tú.</p>
      <div class="candado">${icono("candado")}Cifrados con tu clave: ni otros visitantes ni el servidor pueden leerlos.</div>
      <button class="boton blanco" type="button" data-ir="buzon" style="margin-top:12px">Abrir buzón</button></section>`;
  }
  return `<section class="panel buzon"><div class="panel-titulo"><h2>${icono("buzon")} Escribir a ${esc(e.datos.config.nombre || "Lorena")}</h2></div>
    ${htmlFormBuzon(e, claves)}</section>`;
}

function htmlFormBuzon(e, claves) {
  if (!claves.buzonPublica) return `<p>El buzón aún no está activado.</p>`;
  return `<p>Un mensaje privado: solo lo podrá leer ${esc(e.datos.config.nombre || "Lorena")}.</p>
    <form data-form="buzon-enviar" class="form-buzon">
      <textarea name="texto" required maxlength="4000" rows="4" placeholder="Escribe tu mensaje…" aria-label="Mensaje"></textarea>
      <div class="candado">${icono("candado")}Se cifra en tu dispositivo antes de enviarse.</div>
      <button class="boton principal" type="submit" style="margin-top:12px">Enviar mensaje</button>
    </form>`;
}

export function vistaBuzon(e, claves) {
  if (!e.editor) {
    return `<header class="cabecera-seccion"><div><h1>Escribir a ${esc(e.datos.config.nombre || "Lorena")}</h1><p>Feedback, consejos o lo que quieras decirle en privado.</p></div></header>
      <section class="panel buzon grande">${htmlFormBuzon(e, claves)}</section>`;
  }
  const lista = e.buzon;
  return `<header class="cabecera-seccion"><div><h1>Buzón privado</h1><p>Solo tú puedes leer estos mensajes.</p></div></header>
    ${!lista ? `<div class="vacio">Cargando…</div>` : !lista.length ? `<div class="vacio">Todavía no tienes mensajes.</div>`
      : `<div class="mensajes">${lista.map((m) => `<article class="panel mensaje ${e.datos.buzonLeidos.includes(m.id) ? "" : "nuevo"}">
          <header>${avatar(m.nombre, m.rol)}<div><b>${esc(m.nombre || "Anónimo")}</b> ${chipRol(m.rol)}<small class="texto-suave">${hace(m.fecha)}</small></div>
            ${e.datos.buzonLeidos.includes(m.id) ? "" : `<button class="boton peque" type="button" data-accion="buzon-leido" data-id="${esc(m.id)}">Marcar como leído</button>`}</header>
          <div class="texto">${esc(m.texto).replace(/\n/g, "<br>")}</div></article>`).join("")}</div>`}`;
}

// ---------- Acciones ----------
export const acciones = {
  "foro-nuevo"(b, api) { const e = api.estado(); e.foroNuevo = !e.foroNuevo; api.pintar(); },
  "foro-mod"(b, api) {
    const lista = api.datos().foro[b.dataset.que];
    const i = lista.indexOf(b.dataset.id);
    if (i >= 0) lista.splice(i, 1); else lista.push(b.dataset.id);
    api.cambiar();
  },
  "buzon-leido"(b, api) { api.datos().buzonLeidos.push(b.dataset.id); api.cambiar(); },
};

export const formularios = {
  async "foro-tema"(form, api) {
    const f = new FormData(form);
    const yo = api.yo();
    const id = nuevoId();
    try {
      await publicarForo({ tipo: "tema", id, categoria: f.get("categoria"), titulo: String(f.get("titulo")).trim(), texto: String(f.get("texto")).trim(), nombre: yo.nombre, rol: yo.rol }, f.get("publico"), api.claves());
      api.estado().foroNuevo = false;
      await api.recargarComunidad();
      location.hash = `#comunidad/${id}`;
      api.aviso("Tema publicado");
    } catch (err) { api.aviso(err.message); }
  },
  async "foro-respuesta"(form, api) {
    const f = new FormData(form);
    const yo = api.yo();
    try {
      await publicarForo({ tipo: "respuesta", id: nuevoId(), tema: f.get("tema"), texto: String(f.get("texto")).trim(), nombre: yo.nombre, rol: yo.rol }, f.get("publico"), api.claves());
      await api.recargarComunidad();
      api.aviso("Respuesta publicada");
    } catch (err) { api.aviso(err.message); }
  },
  async "buzon-enviar"(form, api) {
    const f = new FormData(form);
    const yo = api.yo();
    try {
      await enviarBuzon({ nombre: yo.nombre, rol: yo.rol, texto: String(f.get("texto")).trim() }, api.claves().buzonPublica);
      form.reset();
      api.aviso("Mensaje enviado. Solo lo podrá leer Lorena.");
      if (api.editor) api.recargarComunidad();
    } catch (err) { api.aviso(err.message); }
  },
};
