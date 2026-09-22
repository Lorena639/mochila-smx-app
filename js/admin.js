// =============================================================
//  admin.js — Entrada del modo edición (solo con tu token de GitHub)
//  PASO 1  Login con token      -> comprueba permisos del repositorio
//  PASO 2  Contraseña de la web -> descifra los datos (o los crea)
//  PASO 3  Arranca la web con botones de editar + GUARDADO AUTOMÁTICO
// =============================================================
import {
  RUTA_DATOS, datosIniciales, completarDatos, cifrar, descifrar, cifrarBytes, descifrarBytes,
} from "./comun.js";
import { GitHub, repoDesdeUrl } from "./github.js";
import { iniciar } from "./nucleo.js";

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
    datos = datosIniciales();
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
    arrancar();
  } catch {
    $("#errorPassword").textContent = "Contraseña incorrecta.";
  } finally {
    boton.disabled = false; boton.textContent = "Entrar";
  }
});

// =============================================================
//  PASO 3 — Arrancar la web en modo edición
// =============================================================
function arrancar() {
  mostrarPaso("app");
  web = iniciar($("#app"), {
    datos,
    password,
    editor: true,
    gh,
    alCambiar: marcarCambios,
    salir,
    cambiarPassword,
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

async function guardar() {
  clearTimeout(temporizador);
  if (guardando) { otraVez = true; return; }
  guardando = true;
  web?.ponerEstado("guardando", "Guardando…");
  try {
    const archivo = await cifrar(datos, password);
    try { localStorage.setItem(CLAVE_COPIA, JSON.stringify({ sha, archivo })); } catch {}
    sha = await gh.escribir(RUTA_DATOS, JSON.stringify(archivo), sha, "Actualizar Mochila SMX");
    try { localStorage.removeItem(CLAVE_COPIA); } catch {}
    sinGuardar = false;
    web?.ponerEstado("", "Todo guardado");
  } catch (err) {
    web?.ponerEstado("error", err.status === 409 || err.status === 422 ? "Cambiado en otro sitio: recarga" : "Sin conexión: se subirá luego");
  } finally {
    guardando = false;
    if (otraVez) { otraVez = false; guardar(); }
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
      <p class="nota ancho">Tu profe necesitará la nueva contraseña. Los comentarios escritos con la contraseña antigua dejarán de verse.</p>
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
      const refs = [...(datos.config.archivos || []), ...["trabajos", "apuntes", "posts", "formacion"].flatMap((c) => datos[c].flatMap((x) => x.archivos || []))];
      let hechos = 0;
      for (const r of refs) {
        boton.textContent = `Recifrando archivos ${++hechos}/${refs.length}…`;
        const ruta = `data/archivos/${r.id}.enc.json`;
        const f = await gh.leer(ruta);
        if (!f) continue;
        const bytes = await descifrarBytes(JSON.parse(f.texto), password);
        await gh.escribir(ruta, JSON.stringify(await cifrarBytes(bytes, p1)), f.sha, "Cambiar contraseña");
      }
      password = p1;
      await guardar();
      cerrar();
      web.aviso("Contraseña cambiada. Recarga la página para seguir.");
      setTimeout(() => location.reload(), 2500);
    } catch {
      err.textContent = "No se ha podido terminar. Revisa tu conexión e inténtalo otra vez.";
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
