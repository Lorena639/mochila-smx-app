// =============================================================
//  admin.js — Entrada del modo edición (solo con tu token de GitHub)
//  PASO 1  Login con token      -> comprueba permisos del repositorio
//  PASO 2  Contraseña de la web -> descifra los datos (o los crea)
//  PASO 3  Arranca la web con botones de editar + GUARDADO AUTOMÁTICO
// =============================================================
import {
  RUTA_DATOS, datosIniciales, completarDatos, cifrar, descifrar, cifrarBytes, descifrarBytes,
  claveAleatoria, derivarCruda,
} from "./comun.js";
import { GitHub, repoDesdeUrl } from "./github.js";
import { iniciar } from "./nucleo.js";
import { SAL_COMENTARIOS } from "./comentarios.js";
import * as archivos from "./archivos.js";
import { GRUPOS, activos as gruposActivos, paqueteGrupo, archivosAntiguos, abrirGrupos } from "./grupos.js";
import { ponerCalendarioOficial, ponerNotasIniciales } from "./curso.js";
import { crearClavesComunidad } from "./comunidad.js";
import * as Push from "./push.js";

const rutaGrupo = (id) => `data/grupos/${id}.enc.json`;

const $ = (s) => document.querySelector(s);
const CLAVE_TOKEN = "mochila-token";
const CLAVE_REPO = "mochila-repo";
const CLAVE_COPIA = "mochila-copia"; // copia cifrada de cambios aún no subidos

let gh = null;          // conexión con GitHub
let sha = null;         // versión actual del archivo de datos en GitHub
let password = null;    // contraseña de la web
let datos = null;       // datos descifrados
let web = null;         // la web ya arrancada (nucleo)
let sinGuardar = false;

const guardado = {
  get(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch { return null; } },
  set(k, v, recordar) { try { (recordar ? localStorage : sessionStorage).setItem(k, v); } catch {} },
  borrar(k) { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {} },
};
const mostrarPaso = (id) => { for (const p of ["pasoLogin", "pasoPassword", "app"]) $("#" + p).hidden = p !== id; };

// =============================================================
//  PASO 1 — Login con el token
// =============================================================
const repoAuto = repoDesdeUrl();
if (repoAuto) $("#campoRepo").hidden = true;
$("#repo").value = guardado.get(CLAVE_REPO) || "";

let archivoCifrado = null;
async function conectar(token, repoTexto) {
  const repo = repoAuto || (() => {
    const [usuario, nombre] = (repoTexto || "").trim().split("/");
    if (!usuario || !nombre) throw new Error("Escribe el repositorio como usuario/repositorio.");
    return { usuario, repo: nombre };
  })();
  gh = new GitHub(token, repo.usuario, repo.repo);
  await gh.comprobar();
  const archivo = await gh.leer(RUTA_DATOS);
  sha = archivo ? archivo.sha : null;
  archivoCifrado = archivo ? JSON.parse(archivo.texto) : null;
  prepararPassword(!archivo);
}

$("#formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const boton = $("#botonLogin");
  boton.disabled = true; boton.textContent = "Conectando…";
  $("#errorLogin").textContent = "";
  const token = $("#token").value.trim();
  try {
    await conectar(token, $("#repo").value);
    const recordar = $("#recordar").checked;
    guardado.set(CLAVE_TOKEN, token, recordar);
    if (!repoAuto) guardado.set(CLAVE_REPO, $("#repo").value.trim(), recordar);
  } catch (err) {
    $("#errorLogin").textContent =
      err.status === 401 ? "El token no es válido o ha caducado." :
      err.status === 404 ? "No encuentro ese repositorio con este token." :
      err.message || "No se ha podido conectar.";
  } finally {
    boton.disabled = false; boton.textContent = "Iniciar sesión";
  }
});

// =============================================================
//  PASO 2 — Contraseña de la web
// =============================================================
let primeraVez = false;
function prepararPassword(esNueva) {
  primeraVez = esNueva;
  $("#tituloPassword").textContent = esNueva ? "Crea la contraseña de la web" : "Contraseña de la web";
  $("#textoPassword").textContent = esNueva
    ? "Es la que darás a tu profe. Todo se guarda cifrado con ella."
    : "La misma que le das a tu profe.";
  $("#campoPass2").hidden = !esNueva;
  $("#pass2").required = esNueva;
  $("#botonPassword").textContent = esNueva ? "Crear" : "Entrar";
  mostrarPaso("pasoPassword");
  $("#pass1").focus();
}

$("#formPassword").addEventListener("submit", async (e) => {
  e.preventDefault();
  const p1 = $("#pass1").value;
  $("#errorPassword").textContent = "";
  if (primeraVez) {
    if (p1.length < 8) return ($("#errorPassword").textContent = "Usa al menos 8 caracteres.");
    if (p1 !== $("#pass2").value) return ($("#errorPassword").textContent = "Las contraseñas no coinciden.");
    password = p1;
    datos = completarDatos(datosIniciales());
    await prepararClaves();
    arrancar();
    marcarCambios();
    return;
  }
  const boton = $("#botonPassword");
  boton.disabled = true; boton.textContent = "Abriendo…";
  try {
    datos = completarDatos(await descifrar(archivoCifrado, p1));
    password = p1;
    await recuperarCopia();
    const nuevas = await prepararClaves();
    arrancar();
    if (nuevas) marcarCambios();
  } catch {
    $("#errorPassword").textContent = "Contraseña incorrecta.";
  } finally {
    boton.disabled = false; boton.textContent = "Entrar";
  }
});

// Claves que no dependen de la contraseña (se crean una vez y se guardan cifradas):
//  · comentarios: la misma que ya usabas (derivada de tu contraseña actual),
//    así los comentarios antiguos se siguen leyendo aunque cambies la contraseña.
//  · fichajes: aleatoria. Solo la reciben los grupos que pueden ver "Asistencia".
async function prepararClaves() {
  const c = datos.config.claves;
  let nuevas = false;
  if (!c.comentarios) { c.comentarios = await derivarCruda(password, SAL_COMENTARIOS); nuevas = true; }
  if (!c.fichajes) { c.fichajes = claveAleatoria(); nuevas = true; }
  if (await crearClavesComunidad(c)) nuevas = true;
  // Calendario oficial 2026-27 y RA del currículo (solo la primera vez)
  if (ponerCalendarioOficial(datos)) nuevas = true;
  if (ponerNotasIniciales(datos)) nuevas = true;
  return nuevas;
}

// =============================================================
//  PASO 3 — Arrancar la web en modo edición
// =============================================================
function arrancar() {
  shasGrupos = cargarShasGrupos();
  mostrarPaso("app");
  web = iniciar($("#app"), {
    datos,
    password,
    editor: true,
    gh,
    alCambiar: marcarCambios,
    salir,
    cambiarPassword,
    reemplazarDatos(nuevos) { datos = nuevos; marcarCambios(); },
    abrirGrupos: async () => {
      const nuevo = await abrirGrupos(datos, password);
      if (!nuevo) return false;
      datos.config.grupos = nuevo;
      marcarCambios();
      web.aviso("Grupos guardados. Se publican en unos segundos.");
      return true;
    },
  });
  if (sinGuardar) web.ponerEstado("pendiente", "Cambios sin guardar…");
}

function salir() {
  if (sinGuardar) { web.aviso("Espera a que ponga «Todo guardado» antes de salir."); return; }
  guardado.borrar(CLAVE_TOKEN);
  location.hash = "";
  location.reload();
}

// =============================================================
//  GUARDADO AUTOMÁTICO
//  Cada cambio se guarda solo a los 2 segundos:
//   1. Se cifra y se guarda una copia en este ordenador.
//   2. Se sube a GitHub. Si va bien, se borra la copia local.
// =============================================================
let temporizador = null;
let guardando = false;
let otraVez = false;

function marcarCambios() {
  sinGuardar = true;
  web?.ponerEstado("pendiente", "Guardando…");
  clearTimeout(temporizador);
  temporizador = setTimeout(guardar, 2000);
}

let ultimoError = null;
async function guardar() {
  clearTimeout(temporizador);
  if (guardando) { otraVez = true; return; }
  guardando = true;
  web?.ponerEstado("guardando", "Guardando…");
  try {
    await migrarArchivosDeGrupos();
    const archivo = await cifrar(datos, password);
    try { localStorage.setItem(CLAVE_COPIA, JSON.stringify({ sha, archivo })); } catch {}
    sha = await gh.escribir(RUTA_DATOS, JSON.stringify(archivo), sha, "Actualizar Mochila SMX");
    try { localStorage.removeItem(CLAVE_COPIA); } catch {}
    await publicarGrupos();
    sinGuardar = false;
    web?.ponerEstado("", "Todo guardado");
    // Recordatorios de exámenes, entregas y faltas para las notificaciones del móvil
    if (datos.config.avisosListos && datos.config.claves?.avisos) Push.programar(datos.config.claves.avisos, datos).catch(() => {});
  } catch (err) {
    ultimoError = err;
    web?.ponerEstado("error", err.status === 409 || err.status === 422 ? "Cambiado en otro sitio: recarga" : "Sin conexión: se subirá luego");
  } finally {
    guardando = false;
    if (otraVez) { otraVez = false; guardar(); }
  }
}

// =============================================================
//  GRUPOS (Familia, Profes, Amigos)
//  Tras guardar tus datos, se escribe un archivo cifrado por grupo
//  con SOLO lo que ese grupo puede ver. Si no ha cambiado, no se toca.
// =============================================================
let shasGrupos = null;              // promesa { id: sha | null }
const huellas = {};                 // lo último publicado en esta sesión
async function cargarShasGrupos() {
  const r = {};
  for (const g of GRUPOS) { try { r[g.id] = await gh.sha(rutaGrupo(g.id)); } catch { r[g.id] = null; } }
  return r;
}

// Los archivos antiguos iban cifrados con tu contraseña; los grupos no la tienen.
// Se pasan (una sola vez) a clave propia los que vea algún grupo.
async function migrarArchivosDeGrupos() {
  const pendientes = new Set();
  for (const g of gruposActivos(datos)) for (const r of archivosAntiguos(paqueteGrupo(datos, g.id).datos)) pendientes.add(r);
  let n = 0;
  for (const ref of pendientes) {
    web?.ponerEstado("guardando", `Preparando archivos ${++n}/${pendientes.size}…`);
    try { await archivos.migrar(gh, ref, password); } catch { /* se reintenta la próxima vez */ }
  }
}

async function publicarGrupos() {
  const shas = await shasGrupos;
  for (const g of GRUPOS) {
    const conf = datos.config.grupos?.[g.id];
    const ruta = rutaGrupo(g.id);
    if (!(conf?.activo && conf.password)) {
      if (shas[g.id]) { await gh.borrar(ruta, `Quitar acceso de ${g.nombre}`); shas[g.id] = null; }
      delete huellas[g.id];
      continue;
    }
    const paquete = paqueteGrupo(datos, g.id);
    const huella = JSON.stringify(paquete) + "|" + conf.password;
    if (huellas[g.id] === huella) continue;
    web?.ponerEstado("guardando", `Publicando la vista de ${g.nombre}…`);
    const archivo = await cifrar(paquete, conf.password);
    shas[g.id] = await gh.escribir(ruta, JSON.stringify(archivo), shas[g.id], `Actualizar vista de ${g.nombre}`);
    huellas[g.id] = huella;
  }
}

window.addEventListener("online", () => { if (sinGuardar) guardar(); });
window.addEventListener("beforeunload", (e) => { if (sinGuardar) { e.preventDefault(); e.returnValue = ""; } });

// Si la última vez quedaron cambios sin subir, los recupera
async function recuperarCopia() {
  let copia = null;
  try { copia = JSON.parse(localStorage.getItem(CLAVE_COPIA) || "null"); } catch {}
  if (!copia) return;
  if (copia.sha !== sha) { try { localStorage.removeItem(CLAVE_COPIA); } catch {} return; }
  try {
    datos = completarDatos(await descifrar(copia.archivo, password));
    sinGuardar = true;
    setTimeout(() => { web?.aviso("He recuperado cambios que no se habían subido"); marcarCambios(); }, 300);
  } catch {}
}

// =============================================================
//  CAMBIAR LA CONTRASEÑA DE LA WEB
//  Hay que volver a cifrar los datos Y todos los archivos subidos.
// =============================================================
function cambiarPassword() {
  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.innerHTML = `<form class="modal-caja">
    <header class="modal-cabecera"><h2>Cambiar la contraseña de la web</h2></header>
    <div class="modal-cuerpo rejilla-form">
      <p class="nota ancho">Es tu contraseña principal: abre <b>todo</b>. Las de los grupos (Familia, Profes, Amigos) no cambian,
        y los comentarios y fichajes se siguen viendo.</p>
      <div class="campo"><label for="np1">Nueva contraseña</label><input id="np1" type="password" required autocomplete="new-password"></div>
      <div class="campo"><label for="np2">Repítela</label><input id="np2" type="password" required autocomplete="new-password"></div>
      <p class="error ancho" role="alert"></p>
    </div>
    <footer class="modal-pie"><button type="button" class="boton" data-cancelar>Cancelar</button>
      <button type="submit" class="boton principal">Cambiar</button></footer>
  </form>`;
  document.body.appendChild(dlg);
  const cerrar = () => { dlg.close(); dlg.remove(); };
  dlg.querySelector("[data-cancelar]").addEventListener("click", cerrar);
  dlg.addEventListener("cancel", cerrar);
  dlg.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p1 = dlg.querySelector("#np1").value;
    const err = dlg.querySelector(".error");
    if (p1.length < 8) return (err.textContent = "Usa al menos 8 caracteres.");
    if (p1 !== dlg.querySelector("#np2").value) return (err.textContent = "Las contraseñas no coinciden.");
    const boton = dlg.querySelector("button[type=submit]");
    boton.disabled = true;
    try {
      // Los archivos antiguos (cifrados con la contraseña) pasan a llevar su propia clave:
      // así no dependen nunca más de la contraseña. Se prueba la actual y la nueva
      // (por si un intento anterior se quedó a medias). Si uno no se puede abrir, se salta.
      const refs = [...(datos.config.archivos || []), ...["trabajos", "apuntes", "posts", "formacion"].flatMap((c) => (datos[c] || []).flatMap((x) => x.archivos || []))]
        .filter((r) => !r.clave);
      let hechos = 0;
      const fallidos = [];
      for (const r of refs) {
        boton.textContent = `Preparando archivos ${++hechos}/${refs.length}…`;
        try { await archivos.migrar(gh, r, [password, p1]); }
        catch (e) { if (e.code === "mala_password") fallidos.push(r.nombre); else throw e; }
      }
      boton.textContent = "Guardando…";
      password = p1;
      sinGuardar = true;
      while (guardando) await new Promise((ok) => setTimeout(ok, 300));
      ultimoError = null;
      await guardar();
      if (sinGuardar) throw ultimoError || new Error("No se han podido subir los datos a GitHub.");
      cerrar();
      web.aviso(fallidos.length ? `Contraseña cambiada. No se han podido abrir: ${fallidos.join(", ")}` : "Contraseña cambiada. Recarga la página para seguir.");
      setTimeout(() => location.reload(), fallidos.length ? 6000 : 2500);
    } catch (e) {
      console.error(e);
      const detalle = e?.status === 401 || e?.status === 403 ? "El token de GitHub no tiene permiso de escritura."
        : e?.status === 409 || e?.status === 422 ? "Los datos han cambiado en otro sitio: recarga la página."
        : e?.message || String(e);
      err.textContent = `No se ha podido terminar: ${String(detalle).replace(/\.?$/, ".")} Pulsa Cambiar para reintentar.`;
      boton.disabled = false; boton.textContent = "Cambiar";
    }
  });
  dlg.showModal();
}

// ---------- Si ya iniciaste sesión, entra directo al paso 2 ----------
const tokenGuardado = guardado.get(CLAVE_TOKEN);
if (tokenGuardado) {
  $("#token").value = tokenGuardado;
  conectar(tokenGuardado, guardado.get(CLAVE_REPO)).catch(() => mostrarPaso("pasoLogin"));
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
