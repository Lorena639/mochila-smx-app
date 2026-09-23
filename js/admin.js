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
const CLAVE_VINCULO = "mochila-vinculo"; // token cifrado con tu contraseña (dispositivo vinculado)
const CLAVE_AUTO = "mochila-pass-auto";
const RUTA_ACCESO = "data/acceso.enc.json"; // token cifrado con tu contraseña (entrar como Lorena en cualquier sitio)  // contraseña que pasa la app al entrar como admin (solo esta pestaña)

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
//  DISPOSITIVO VINCULADO
//  El token de GitHub viaja cifrado con tu contraseña principal
//  (enlace o QR desde el PC). En este dispositivo basta la contraseña.
// =============================================================
const b64u = (s) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
export function leerVinculo() { try { return JSON.parse(localStorage.getItem(CLAVE_VINCULO) || "null"); } catch { return null; } }
let vinculoNuevo = false;
{
  const m = location.hash.match(/vincular=([\w-]+)/);
  if (m) {
    try {
      const v = JSON.parse(deB64u(m[1]));
      if (v?.c?.datos) { localStorage.setItem(CLAVE_VINCULO, JSON.stringify(v)); vinculoNuevo = true; }
    } catch { /* enlace roto */ }
    history.replaceState(null, "", location.pathname);
  }
}
let modoVinculo = false;
let vinculoActual = null;
async function vinculoRemoto() {
  try { const r = await fetch(`${RUTA_ACCESO}?t=${Date.now()}`, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch { return null; }
}
function prepararVinculo() {
  modoVinculo = true;
  primeraVez = false;
  $("#tituloPassword").textContent = "Entrar como Lorena";
  $("#textoPassword").textContent = vinculoNuevo
    ? "Dispositivo vinculado. Escribe tu contraseña principal para terminar."
    : "Este dispositivo está vinculado. Escribe tu contraseña principal.";
  $("#campoPass2").hidden = true;
  $("#pass2").required = false;
  $("#botonPassword").textContent = "Entrar";
  $("#olvidarDispositivo").hidden = false;
  mostrarPaso("pasoPassword");
  $("#pass1").focus();
}
$("#olvidarDispositivo")?.addEventListener("click", (ev) => {
  if (ev.currentTarget.dataset.remoto) { modoVinculo = false; vinculoActual = null; mostrarPaso("pasoLogin"); return; }
  try { localStorage.removeItem(CLAVE_VINCULO); } catch {}
  guardado.borrar(CLAVE_TOKEN);
  location.reload();
});

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
  $("#tituloPassword").textContent = esNueva ? "Crea tu contraseña principal" : "Entrar como Lorena";
  $("#textoPassword").textContent = esNueva
    ? "Es solo tuya (modo estudiante). Todo se guarda cifrado con ella. A profes y familia les das la de su grupo."
    : "Modo estudiante: tu contraseña principal, solo tuya. Con ella añades y editas todo.";
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
  if (modoVinculo && !gh) {
    const v = vinculoActual || leerVinculo();
    let token = null;
    try { token = new TextDecoder().decode(await descifrarBytes(v.c, p1)); }
    catch {
      $("#errorPassword").textContent = "Contraseña incorrecta. Si la cambiaste, vuelve a vincular este dispositivo desde el PC.";
      boton.disabled = false; boton.textContent = "Entrar";
      return;
    }
    try {
      await conectar(token, v.r);
      guardado.set(CLAVE_TOKEN, token, false); // solo mientras esté abierta la pestaña
    } catch (err) {
      $("#errorPassword").textContent = err.status === 401
        ? "El token del vínculo ya no vale (caducado o borrado). Vuelve a vincular desde el PC."
        : err.message || "No se ha podido conectar con GitHub.";
      boton.disabled = false; boton.textContent = "Entrar";
      return;
    }
  }
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
    vincular,
    accesoRemoto,
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
      // Si este dispositivo está vinculado, el vínculo pasa a la contraseña nueva
      if (datos.config.accesoRemoto) { try { await escribirAcceso(p1); } catch { /* se puede reactivar luego */ } }
      if (leerVinculo()) {
        try { localStorage.setItem(CLAVE_VINCULO, JSON.stringify({ r: `${gh.usuario}/${gh.repo}`, c: await cifrarBytes(new TextEncoder().encode(gh.token), p1) })); } catch {}
      }
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

// =============================================================
//  VINCULAR UN MÓVIL (desde el PC ya conectado)
// =============================================================
const QR_LIB = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
let qrCargado = null;
const cargarQR = () => (qrCargado ||= new Promise((ok, mal) => {
  if (window.qrcode) return ok(window.qrcode);
  const s = document.createElement("script");
  s.src = QR_LIB;
  s.onload = () => ok(window.qrcode);
  s.onerror = () => mal(new Error("No se ha podido cargar el QR"));
  document.head.appendChild(s);
}));
async function vincular() {
  const cifrado = await cifrarBytes(new TextEncoder().encode(gh.token), password);
  const enlace = `${location.origin}${location.pathname}#vincular=${b64u(JSON.stringify({ r: `${gh.usuario}/${gh.repo}`, c: cifrado }))}`;
  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.innerHTML = `<div class="modal-caja">
    <header class="modal-cabecera"><h2>Vincular un móvil</h2></header>
    <div class="modal-cuerpo">
      <p>Escanea el código con la cámara del móvil (o mándate el enlace). Después, en ese móvil entras como <b>admin</b> solo con tu contraseña principal.</p>
      <div class="qr-vincular" id="qrVincular"><small class="texto-suave">Generando código…</small></div>
      <div class="copiable"><input id="enlaceVincular" class="mono" readonly value="${enlace}"><button type="button" class="boton peque" id="copiarVincular">Copiar enlace</button></div>
      <p class="nota">El enlace lleva tu token <b>cifrado con tu contraseña</b>: sin ella no sirve. No lo publiques. Si pierdes el móvil, borra el token en GitHub y crea otro.</p>
    </div>
    <footer class="modal-pie"><button type="button" class="boton principal" data-cerrar>Hecho</button></footer></div>`;
  document.body.appendChild(dlg);
  const cerrar = () => { dlg.close(); dlg.remove(); };
  dlg.querySelector("[data-cerrar]").addEventListener("click", cerrar);
  dlg.addEventListener("cancel", cerrar);
  dlg.querySelector("#copiarVincular").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(enlace); web.aviso("Enlace copiado"); } catch { dlg.querySelector("#enlaceVincular").select(); }
  });
  dlg.showModal();
  try {
    const qr = (await cargarQR())(0, "L");
    qr.addData(enlace);
    qr.make();
    dlg.querySelector("#qrVincular").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  } catch {
    dlg.querySelector("#qrVincular").innerHTML = `<small class="texto-suave">No se ha podido crear el QR: usa «Copiar enlace».</small>`;
  }
}

// Entrar como Lorena en cualquier dispositivo: el token va cifrado con tu contraseña en el repo
async function escribirAcceso(pass) {
  const v = { r: `${gh.usuario}/${gh.repo}`, c: await cifrarBytes(new TextEncoder().encode(gh.token), pass) };
  await gh.escribir(RUTA_ACCESO, JSON.stringify(v), await gh.sha(RUTA_ACCESO), "Acceso de Lorena");
}
async function accesoRemoto(activar) {
  if (activar) {
    if (password.length < 12) {
      web.aviso("Para esto tu contraseña principal tiene que tener 12 caracteres o más. Cámbiala primero.", 7000);
      return;
    }
    const ok = await web.confirmar("Cualquiera que sepa tu contraseña principal podrá entrar como tú y editar. Úsala solo tú y que sea larga. ¿Activar?");
    if (!ok) return;
    try { await escribirAcceso(password); datos.config.accesoRemoto = true; marcarCambios(); web.aviso("Activado. En cualquier dispositivo, tu contraseña principal abre el modo estudiante."); }
    catch (err) { web.aviso(`No se ha podido activar: ${err.message}`, 6000); }
  } else {
    try { await gh.borrar(RUTA_ACCESO, "Quitar acceso de Lorena"); datos.config.accesoRemoto = false; marcarCambios(); web.aviso("Desactivado. Solo los dispositivos vinculados entran como tú."); }
    catch (err) { web.aviso(`No se ha podido desactivar: ${err.message}`, 6000); }
  }
  web.pintar();
}

// Entrar solo con la contraseña (viene de la app o de un dispositivo vinculado)
function autoEntrar() {
  let p = null;
  try { p = sessionStorage.getItem(CLAVE_AUTO); sessionStorage.removeItem(CLAVE_AUTO); } catch {}
  if (!p) return;
  $("#pass1").value = p;
  $("#formPassword").requestSubmit();
}

// ---------- Si ya iniciaste sesión, entra directo al paso 2 ----------
const tokenGuardado = guardado.get(CLAVE_TOKEN);
if (tokenGuardado) {
  $("#token").value = tokenGuardado;
  conectar(tokenGuardado, guardado.get(CLAVE_REPO)).then(autoEntrar).catch(() => (leerVinculo() ? prepararVinculo() : mostrarPaso("pasoLogin")));
} else if (leerVinculo()) {
  prepararVinculo();
  autoEntrar();
} else {
  // ¿Está activado «entrar como Lorena en cualquier dispositivo»?
  vinculoRemoto().then((v) => {
    if (!v?.c?.datos) return;
    vinculoActual = v;
    prepararVinculo();
    const b = $("#olvidarDispositivo");
    b.textContent = "Entrar con token de GitHub";
    b.dataset.remoto = "1";
    $("#textoPassword").textContent = "Modo estudiante: escribe tu contraseña principal.";
    autoEntrar();
  });
}
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
