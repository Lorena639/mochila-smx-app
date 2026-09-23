// =============================================================
//  app.js — Entrada de la web para tu profe (solo lectura)
//  Pide la contraseña, descifra los datos y arranca el núcleo.
// =============================================================
import { RUTA_DATOS, descifrar, completarDatos, sesion } from "./comun.js";
import { iniciar } from "./nucleo.js";
import * as comentarios from "./comentarios.js";
import { GRUPOS, grupoDe } from "./grupos.js";

const $ = (s) => document.querySelector(s);
const CLAVE_SESION = "mochila-pass";

// La contraseña decide qué se ve: primero se prueba con los grupos
// (Familia, Profes, Amigos) y, si no, con la contraseña principal (todo).
async function leer(ruta) {
  const r = await fetch(`${ruta}?t=${Date.now()}`, { cache: "no-store" });
  return r.ok ? r.json() : null;
}
async function abrir(password) {
  const archivos = await Promise.all([...GRUPOS.map((g) => leer(`data/grupos/${g.id}.enc.json`).catch(() => null)), leer(RUTA_DATOS).catch(() => null)]);
  if (archivos.every((a) => !a)) throw new Error("Todavía no hay contenido o no hay conexión.");
  for (const [i, archivo] of archivos.entries()) {
    if (!archivo) continue;
    try {
      const abierto = await descifrar(archivo, password);
      if (i < GRUPOS.length) return { grupo: abierto.grupo, secciones: abierto.secciones, claves: abierto.claves || {}, datos: completarDatos(abierto.datos) };
      const datos = completarDatos(abierto);
      return { grupo: null, secciones: null, claves: datos.config.claves || {}, datos };
    } catch (e) { if (e.code !== "mala_password") throw e; }
  }
  const e = new Error("Contraseña incorrecta");
  e.code = "mala_password";
  throw e;
}

// Dispositivo vinculado (o con el token guardado): con la contraseña principal se entra como admin
const puedeSerAdmin = () => { try { return Boolean(localStorage.getItem("mochila-vinculo") || localStorage.getItem("mochila-token")); } catch { return false; } };

async function entrar(password) {
  const { grupo, secciones, claves, datos } = await abrir(password);
  if (!grupo && puedeSerAdmin()) {
    try { sessionStorage.setItem("mochila-pass-auto", password); } catch {}
    location.href = "admin.html";
    return;
  }
  sesion.set(CLAVE_SESION, password);
  $("#pantallaAcceso").hidden = true;
  // Primera vez en este dispositivo: "crear cuenta" (solo nombre; el rol lo pone el grupo)
  let yo = comentarios.quienSoy();
  if (!yo) { await pedirQuien(grupo); yo = comentarios.quienSoy(); }
  if (grupo && yo.rol !== grupoDe(grupo)?.rol) { yo = { ...yo, rol: grupoDe(grupo).rol }; comentarios.guardarQuienSoy(yo); }
  const acceso = claves.comentarios ? { clave: claves.comentarios } : password;
  comentarios.apuntarVisita(yo, acceso);
  $("#app").hidden = false;
  iniciar($("#app"), {
    datos,
    password,
    acceso,
    secciones,
    grupo,
    claveFichajes: claves.fichajes || null,
    clavesComunidad: grupo ? { foro: claves.foro || {}, buzonPublica: claves.buzonPublica, avisos: claves.avisos || null } : undefined,
    editor: false,
    salir() { sesion.del(CLAVE_SESION); location.hash = ""; location.reload(); },
    cambiarQuien() { comentarios.olvidarQuienSoy(); location.reload(); },
  });
}

function pedirQuien(grupo) {
  $("#pantallaQuien").hidden = false;
  // Si la contraseña ya dice el grupo, no hace falta preguntar el rol
  $("#campoRol").hidden = Boolean(grupo);
  $("#quienNombre").focus();
  return new Promise((resolver) => {
    $("#formQuien").addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = $("#quienNombre").value.trim();
      if (!nombre) return;
      const rol = grupo ? grupoDe(grupo).rol : document.querySelector('input[name="rol"]:checked')?.value || "";
      comentarios.guardarQuienSoy({ nombre, rol });
      $("#pantallaQuien").hidden = true;
      resolver();
    });
  });
}

$("#formAcceso").addEventListener("submit", async (e) => {
  e.preventDefault();
  const boton = $("#botonEntrar");
  boton.disabled = true; boton.textContent = "Comprobando…";
  $("#errorAcceso").textContent = "";
  try {
    await entrar($("#password").value);
  } catch (err) {
    $("#errorAcceso").textContent = err.code === "mala_password" ? "Contraseña incorrecta. Prueba otra vez." : err.message;
    $("#password").select();
  } finally {
    boton.disabled = false; boton.textContent = "Entrar";
  }
});

// Si ya entraste en esta pestaña, no vuelve a pedir la contraseña
const guardada = sesion.get(CLAVE_SESION);
if (guardada) entrar(guardada).catch(() => sesion.del(CLAVE_SESION));

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
