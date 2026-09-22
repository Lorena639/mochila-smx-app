// =============================================================
//  app.js — Entrada de la web para tu profe (solo lectura)
//  Pide la contraseña, descifra los datos y arranca el núcleo.
// =============================================================
import { RUTA_DATOS, descifrar, completarDatos, sesion } from "./comun.js";
import { iniciar } from "./nucleo.js";
import * as comentarios from "./comentarios.js";

const $ = (s) => document.querySelector(s);
const CLAVE_SESION = "mochila-pass";

async function entrar(password) {
  const r = await fetch(`${RUTA_DATOS}?t=${Date.now()}`, { cache: "no-store" });
  if (r.status === 404) throw new Error("Todavía no hay contenido.");
  if (!r.ok) throw new Error("No se han podido cargar los datos.");
  const datos = completarDatos(await descifrar(await r.json(), password));
  sesion.set(CLAVE_SESION, password);
  $("#pantallaAcceso").hidden = true;
  // Primera vez en este dispositivo: "crear cuenta" (solo nombre y rol)
  if (!comentarios.quienSoy()) await pedirQuien();
  comentarios.apuntarVisita(comentarios.quienSoy(), password);
  $("#app").hidden = false;
  iniciar($("#app"), {
    datos,
    password,
    editor: false,
    salir() { sesion.del(CLAVE_SESION); location.hash = ""; location.reload(); },
    cambiarQuien() { comentarios.olvidarQuienSoy(); location.reload(); },
  });
}

function pedirQuien() {
  $("#pantallaQuien").hidden = false;
  $("#quienNombre").focus();
  return new Promise((resolver) => {
    $("#formQuien").addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = $("#quienNombre").value.trim();
      if (!nombre) return;
      const rol = document.querySelector('input[name="rol"]:checked')?.value || "";
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
