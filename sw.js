// =============================================================
//  sw.js — Permite instalar la web como app y abrirla sin conexión.
//  - Archivos de la app: se piden siempre nuevos (así las
//    actualizaciones llegan solas) y se guarda una copia por si
//    no hay internet.
//  - Datos (data/): siempre se piden nuevos; si no hay internet,
//    se usa la última copia guardada (sigue cifrada).
// =============================================================
const VERSION = "mochila-v5";
const ARCHIVOS = [
  "./", "index.html", "css/estilos.css", "css/app.css",
  "js/app.js", "js/nucleo.js", "js/comun.js", "js/vistas.js", "js/iconos.js",
  "js/archivos.js", "js/comentarios.js", "js/config.js", "js/grupos.js", "js/asistencia.js",
  "fichar.html", "js/fichar.js", "js/curso.js", "js/notas.js", "js/faltas.js", "js/comunidad.js", "js/estudio.js",
  "js/herramientas.js", "js/python.js", "js/estada.js", "js/extras.js", "js/editor.js", "js/formularios.js",
  "manifest.webmanifest", "img/icono-192.png", "img/icono-512.png", "img/favicon.png",
  "img/logo-digitech.png", "img/logo-digitech-blanco.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // Datos: primero internet, si falla la copia guardada
  if (url.pathname.includes("/data/")) {
    e.respondWith(
      fetch(e.request).then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(url.pathname, copia)); }
        return r;
      }).catch(() => caches.match(url.pathname))
    );
    return;
  }
  // Resto (código y diseño): primero internet, para que los cambios
  // se vean al momento; si no hay conexión, la copia guardada.
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
