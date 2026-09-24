// =============================================================
//  comun.js — Código compartido por la web pública y el panel admin
//  - Constantes (tipos, estados)
//  - Cifrado con contraseña (AES-GCM + PBKDF2, del propio navegador)
//  - Utilidades de fechas, texto y clasificación automática
// =============================================================

export const RUTA_DATOS = "data/datos.enc.json";

export const TIPOS = ["Apuntes", "Práctica", "Ejercicio", "Examen", "Presentación", "Código", "Trabajo", "Otro"];

export const ESTADOS = [
  { id: "curso", nombre: "En curso" },
  { id: "entregado", nombre: "Entregado" },
  { id: "corregido", nombre: "Corregido" },
  { id: "estudiar", nombre: "Para estudiar" },
];

export const TIPOS_EVENTO = ["Examen", "Entrega", "Recuperación", "Festivo", "Vacaciones", "Sin clase", "Evaluación", "Trámite", "Otro"];

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export const TIPOS_FORMACION = ["Curso", "Certificación", "Titulación", "Taller", "Otro"];
export const ESTADOS_FORMACION = ["Pendiente", "En curso", "Completado"];

export const COLORES = ["#2F55E4", "#E0674B", "#1F9D74", "#9B5DE5", "#D9A21B", "#1E9BC4", "#D1477A", "#6B7A2E", "#7A5C3E", "#4E6CB0"];

// Datos iniciales la primera vez que se crea la web
export function datosIniciales() {
  return {
    config: {
      nombre: "Lorena",
      curso: "2º SMX",
      centro: "Digitech Barcelona",
      descripcion: "Mis trabajos y fechas del ciclo de Sistemas Microinformáticos y Redes.",
    },
    asignaturas: [
      { id: "0224", nombre: "0224 Sistemes operatius en xarxa", color: COLORES[0] },
      { id: "0226", nombre: "0226 Seguretat informàtica", color: COLORES[1] },
      { id: "0227", nombre: "0227 Serveis de xarxa", color: COLORES[2] },
      { id: "0228", nombre: "0228 Aplicacions web", color: COLORES[3] },
      { id: "1713", nombre: "1713 Projecte intermodular", color: COLORES[4] },
      { id: "1710", nombre: "1710 Itinerari personal per a l'ocupabilitat II", color: COLORES[5] },
      { id: "python", nombre: "Python (pendiente de 1º)", color: COLORES[6] },
      { id: "blog", nombre: "Blog personal", color: COLORES[7] },
      { id: "tutoria", nombre: "Tutoria 2n SMX", color: COLORES[9] },
    ],
    // Horario semanal (dia: 1 = lunes … 5 = viernes)
    horario: [
      { id: "h1", dia: 1, inicio: "08:00", fin: "11:00", asignatura: "0224", aula: "Aula 4", profe: "G. Santos" },
      { id: "h2", dia: 1, inicio: "11:20", fin: "14:20", asignatura: "0226", aula: "Aula 4", profe: "S. Cundumi" },
      { id: "h3", dia: 2, inicio: "08:00", fin: "11:00", asignatura: "0228", aula: "Aula 4", profe: "A. Cañas" },
      { id: "h4", dia: 2, inicio: "11:20", fin: "14:20", asignatura: "0227", aula: "Aula 4", profe: "E. López" },
      { id: "h5", dia: 3, inicio: "08:00", fin: "11:00", asignatura: "0226", aula: "Aula 4", profe: "S. Cundumi" },
      { id: "h6", dia: 3, inicio: "11:20", fin: "13:20", asignatura: "0227", aula: "Aula 4", profe: "E. López" },
      { id: "h7", dia: 3, inicio: "13:20", fin: "14:20", asignatura: "tutoria", aula: "Aula 4", profe: "I. Santana" },
      { id: "h8", dia: 4, inicio: "09:00", fin: "11:00", asignatura: "1713", aula: "Aula 4", profe: "S. Patricia" },
      { id: "h9", dia: 4, inicio: "11:20", fin: "14:20", asignatura: "1710", aula: "Aula 4", profe: "B. Murciano" },
      { id: "h10", dia: 5, inicio: "11:20", fin: "14:20", asignatura: "0224", aula: "Aula 4", profe: "G. Santos" },
    ],
    trabajos: [],
    apuntes: [],
    posts: [],
    avisos: [],
    formacion: [],
    eventos: [
      { id: "ev-merce", titulo: "Festiu: La Mercè", fecha: "2026-09-24", tipo: "Festivo", asignatura: "", nota: "No hay clase" },
      { id: "ev-conval", titulo: "Fin del plazo de convalidaciones", fecha: "2026-09-30", tipo: "Entrega", asignatura: "", nota: "Sol·licitud de convalidacions" },
    ],
  };
}

// Completa datos guardados con versiones anteriores (para que nada falte)
export function completarDatos(d) {
  d.config ||= {};
  d.asignaturas ||= [];
  d.trabajos ||= [];
  d.eventos ||= [];
  d.horario ||= [];
  d.apuntes ||= [];
  d.posts ||= [];
  d.avisos ||= [];
  d.formacion ||= [];
  d.comentariosOcultos ||= [];
  d.config.claves ||= {};
  d.config.grupos ||= {};
  d.faltas ||= [];            // faltas y retrasos por hora de clase
  d.faltasRevisadas ||= [];   // propuestas de falta ya contestadas
  d.tarjetas ||= [];          // tarjetas de repaso
  d.estudio ||= [];           // sesiones del temporizador
  d.python ||= null;          // plan de Python (se crea al abrirlo)
  d.estada ||= null;          // diario de la Estada a l'empresa
  d.foro ||= { fijados: [], cerrados: [], ocultos: [] };
  d.buzonLeidos ||= [];
  return d;
}

// -------------------------------------------------------------
//  Cifrado
//  El archivo guardado en GitHub tiene esta forma:
//  { v: 1, iter, salt, iv, datos }   (todo en base64 salvo v/iter)
// -------------------------------------------------------------
const ITERACIONES = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const aB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const deB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derivarClave(password, salt, iter) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Las claves derivadas se recuerdan para no repetir el cálculo (es lento a propósito)
const cacheClaves = new Map();
async function claveDe(password, saltB64, iter) {
  const k = `${iter}|${saltB64}|${password}`;
  if (!cacheClaves.has(k)) cacheClaves.set(k, derivarClave(password, deB64(saltB64), iter));
  return cacheClaves.get(k);
}

// Cifra bytes (archivos) o texto
export async function cifrarBytes(bytes, password, extra = {}) {
  const salt = aB64(crypto.getRandomValues(new Uint8Array(16)));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clave = await claveDe(password, salt, ITERACIONES);
  const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, clave, bytes);
  return { v: 1, iter: ITERACIONES, salt, iv: aB64(iv), datos: aB64(datos), ...extra };
}

// Lanza un error con code "mala_password" si la contraseña no es correcta
export async function descifrarBytes(archivo, password) {
  const clave = await claveDe(password, archivo.salt, archivo.iter || ITERACIONES);
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(archivo.iv) }, clave, deB64(archivo.datos)));
  } catch {
    const e = new Error("Contraseña incorrecta");
    e.code = "mala_password";
    throw e;
  }
}

// ---------- Cifrado con clave aleatoria (sin contraseña) ----------
// Cada archivo nuevo lleva su propia clave, guardada dentro de los datos
// cifrados. Así cada grupo (Familia, Profes, Amigos) puede abrir solo
// los archivos de lo que puede ver, sin conocer tu contraseña.
export { aB64, deB64 };
export const claveAleatoria = () => aB64(crypto.getRandomValues(new Uint8Array(32)));
const cacheCrudas = new Map();
export function importarClave(b64) {
  if (!cacheCrudas.has(b64)) cacheCrudas.set(b64, crypto.subtle.importKey("raw", deB64(b64), "AES-GCM", false, ["encrypt", "decrypt"]));
  return cacheCrudas.get(b64);
}
export async function cifrarConClave(bytes, claveB64) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const datos = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await importarClave(claveB64), bytes);
  return { v: 3, iv: aB64(iv), datos: aB64(datos) };
}
export async function descifrarConClave(archivo, claveB64) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(archivo.iv) }, await importarClave(claveB64), deB64(archivo.datos)));
}
// Deriva una clave "cruda" (exportable) de una contraseña con una sal fija
export async function derivarCruda(password, sal) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(sal), iterations: ITERACIONES, hash: "SHA-256" }, base, 256);
  return aB64(bits);
}

export const cifrar = (objeto, password) => cifrarBytes(enc.encode(JSON.stringify(objeto)), password);
export const descifrar = async (archivo, password) => JSON.parse(dec.decode(await descifrarBytes(archivo, password)));

// -------------------------------------------------------------
//  Utilidades
// -------------------------------------------------------------
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const nuevoId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);

export const normalizar = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function diasHasta(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((d - hoy) / 86400000);
}

export function fechaCorta(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function fechaLarga(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export function textoCuando(iso) {
  const k = diasHasta(iso);
  if (k === null) return "";
  if (k === 0) return "hoy";
  if (k === 1) return "mañana";
  if (k === -1) return "ayer";
  return fechaCorta(iso);
}

export function claseUrgencia(iso, hecho = false) {
  const k = diasHasta(iso);
  if (k === null || hecho) return "";
  if (k < 0) return "pasada";
  if (k <= 7) return "pronto";
  return "";
}

export const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const tamano = (bytes) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// -------------------------------------------------------------
//  Texto con formato sencillo (para apuntes, posts…)
//   ## Título      - lista      **negrita**   *cursiva*
//   `código`       ```bloque de código```     [texto](https://…)
// -------------------------------------------------------------
export function formato(texto) {
  if (!texto) return "";
  const enLinea = (t) => t
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const partes = esc(texto).replace(/\r/g, "").split(/```/);
  return partes.map((parte, i) => {
    if (i % 2 === 1) return `<pre><code>${parte.replace(/^\w*\n/, "")}</code></pre>`;
    return parte.split(/\n{2,}/).map((bloque) => {
      const b = bloque.trim();
      if (!b) return "";
      const lineas = b.split("\n");
      if (lineas.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lineas.map((l) => `<li>${enLinea(l.replace(/^\s*[-*] /, ""))}</li>`).join("")}</ul>`;
      if (lineas.every((l) => /^\s*\d+[.)] /.test(l))) return `<ol>${lineas.map((l) => `<li>${enLinea(l.replace(/^\s*\d+[.)] /, ""))}</li>`).join("")}</ol>`;
      if (/^#{1,3} /.test(b) && lineas.length === 1) return `<h3>${enLinea(b.replace(/^#{1,3} /, ""))}</h3>`;
      return `<p>${lineas.map(enLinea).join("<br>")}</p>`;
    }).join("");
  }).join("");
}

// Adivina tipo y asignatura a partir del título o enlace
export function clasificar(texto, asignaturas) {
  const n = normalizar(texto);
  const r = {};
  if (/examen|exam|control|parcial/.test(n)) r.tipo = "Examen";
  else if (/\.(py|js|html|css|sh|bat|ps1|sql|java)\b|github\.com|repo/.test(n)) r.tipo = "Código";
  else if (/practica|pract\b|lab|activitat|actividad|\bae\d/.test(n)) r.tipo = "Práctica";
  else if (/ejercicio|exercici/.test(n)) r.tipo = "Ejercicio";
  else if (/apunte|tema|resumen|teoria|esquema/.test(n)) r.tipo = "Apuntes";
  else if (/presentacion|diapositiva|slides|\.pptx?\b/.test(n)) r.tipo = "Presentación";
  else if (/trabajo|treball|proyecto|projecte|informe|memoria/.test(n)) r.tipo = "Trabajo";

  // 1) Código del módulo escrito en el título (p. ej. "0227")
  const porCodigo = asignaturas.find((a) => a.id.length >= 4 && n.includes(normalizar(a.id)));
  if (porCodigo) r.asignatura = porCodigo.id;

  // 2) Palabras temáticas -> asignatura
  if (!r.asignatura) {
    const pistas = [
      [/\.py\b|python|bucle|funcion/, /python/],
      [/\.html|\.css|\.js\b|\bweb\b|pagina|php|wordpress|\bcms\b/, /aplicacions web/],
      [/blog/, /blog/],
      [/dhcp|dns|ftp|http|apache|nginx|correo|correu|mail|proxy|servei|servicio/, /serveis/],
      [/windows|linux|ubuntu|server|servidor|domini|active directory|samba|usuari|permis/, /sistemes|operatius/],
      [/segur|firewall|backup|copia|antivirus|cifrad|xifrat|malware/, /seguretat/],
      [/ocupabilitat|curriculum|\bcv\b|entrevista|empresa|practiques/, /ocupabilitat/],
      [/intermodular|projecte/, /intermodular/],
    ];
    for (const [re, reAsig] of pistas) {
      if (re.test(n)) {
        const a = asignaturas.find((x) => reAsig.test(normalizar(x.nombre)));
        if (a) { r.asignatura = a.id; break; }
      }
    }
  }

  // 3) Palabras del nombre de la asignatura (las que no se repiten entre asignaturas)
  if (!r.asignatura) {
    const comunes = new Set(["personal", "xarxa", "pendiente", "para"]);
    for (const a of asignaturas) {
      const palabras = normalizar(a.nombre).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !comunes.has(w));
      if (palabras.some((w) => n.includes(w))) { r.asignatura = a.id; break; }
    }
  }
  return r;
}

// Guarda la contraseña solo mientras la pestaña esté abierta
export const sesion = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};

// Notificación del sistema con el icono de la app (en Android hay que usar el service worker)
export async function notificar(titulo, opciones = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const o = { icon: "img/icono-192.png", badge: "img/badge-96.png", ...opciones };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(titulo, o);
  } catch { /* sin service worker */ }
  try { new Notification(titulo, o); } catch { /* móvil sin soporte directo */ }
}
