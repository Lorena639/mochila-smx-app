// =============================================================
//  archivos.js — Subir, descargar y borrar archivos adjuntos
//  (trabajos, apuntes en PDF, certificados, fotos de los posts).
//  Cada archivo se guarda CIFRADO en data/archivos/<id>.enc.json
// =============================================================
import { descifrarBytes, nuevoId, claveAleatoria, cifrarConClave, descifrarConClave } from "./comun.js";

export const TAMANO_MAXIMO = 20 * 1024 * 1024; // 20 MB por archivo
const ruta = (id) => `data/archivos/${id}.enc.json`;

// Sube un archivo (solo en el panel). Devuelve la referencia que se guarda en los datos.
// Cada archivo lleva su propia clave aleatoria (ref.clave), que viaja dentro de los datos cifrados.
export async function subir(gh, archivo) {
  if (archivo.size > TAMANO_MAXIMO) throw new Error(`«${archivo.name}» pesa más de 20 MB.`);
  const id = nuevoId();
  const clave = claveAleatoria();
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const cifrado = await cifrarConClave(bytes, clave);
  await gh.escribir(ruta(id), JSON.stringify(cifrado), null, `Subir archivo ${archivo.name}`);
  return { id, nombre: archivo.name, tipo: archivo.type || "application/octet-stream", tamano: archivo.size, clave };
}

// Archivos antiguos (cifrados con la contraseña): los pasa a clave propia
// para que los grupos puedan abrirlos. Cambia ref.clave. Devuelve true si lo ha hecho.
// Acepta una contraseña o una lista (prueba cada una).
export async function migrar(gh, ref, password) {
  if (ref.clave) return false;
  const f = await gh.leer(ruta(ref.id));
  if (!f) return false;
  const cifrado = JSON.parse(f.texto);
  let bytes = null;
  for (const p of [].concat(password)) { try { bytes = await descifrarBytes(cifrado, p); break; } catch {} }
  if (!bytes) { const e = new Error("Contraseña incorrecta"); e.code = "mala_password"; throw e; }
  const clave = claveAleatoria();
  await gh.escribir(ruta(ref.id), JSON.stringify(await cifrarConClave(bytes, clave)), f.sha, `Preparar archivo ${ref.nombre} para grupos`);
  ref.clave = clave;
  cache.delete(ref.id);
  return true;
}

export async function borrar(gh, ref) {
  try { await gh.borrar(ruta(ref.id), `Borrar archivo ${ref.nombre}`); } catch {}
}

// Descarga y descifra. Devuelve una URL temporal (blob:) para abrir o descargar.
const cache = new Map();
export async function urlDe(ref, password) {
  if (cache.has(ref.id)) return cache.get(ref.id);
  const promesa = (async () => {
    const r = await fetch(`${ruta(ref.id)}?v=${ref.id}${ref.clave ? "-k" : ""}`);
    if (!r.ok) throw new Error("El archivo aún no está disponible. Prueba en un par de minutos.");
    const cifrado = await r.json();
    const bytes = ref.clave ? await descifrarConClave(cifrado, ref.clave) : await descifrarBytes(cifrado, password);
    return URL.createObjectURL(new Blob([bytes], { type: ref.tipo }));
  })();
  cache.set(ref.id, promesa);
  promesa.catch(() => cache.delete(ref.id));
  return promesa;
}

export async function descargar(ref, password) {
  const url = await urlDe(ref, password);
  const a = document.createElement("a");
  a.href = url;
  // PDFs e imágenes se abren en otra pestaña; el resto se descarga
  if (/^(application\/pdf|image\/)/.test(ref.tipo)) a.target = "_blank";
  else a.download = ref.nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Reduce las fotos grandes (las del móvil pesan 3-5 MB) antes de subirlas:
// máximo 1600 px de lado y calidad JPEG 85 %. Los GIF y el resto de archivos no se tocan.
export async function prepararImagen(archivo) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(archivo.type)) return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const lado = 1600;
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && archivo.size < 900 * 1024) return archivo;
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bitmap.width * escala);
    lienzo.height = Math.round(bitmap.height * escala);
    lienzo.getContext("2d").drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], archivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
