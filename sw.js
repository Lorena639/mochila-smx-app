// =============================================================
//  sw.js — Permite instalar la web como app y abrirla sin conexión.
//  - Archivos de la app: se piden siempre nuevos (así las
//    actualizaciones llegan solas) y se guarda una copia por si
//    no hay internet.
//  - Datos (data/): siempre se piden nuevos; si no hay internet,
//    se usa la última copia guardada (sigue cifrada).
// =============================================================
const VERSION = "mochila-v19";
const ARCHIVOS = [
  "./", "index.html", "css/estilos.css", "css/app.css",
  "js/app.js", "js/nucleo.js", "js/comun.js", "js/vistas.js", "js/iconos.js",
  "js/archivos.js", "js/comentarios.js", "js/config.js", "js/grupos.js", "js/asistencia.js",
  "fichar.html", "js/fichar.js", "js/curso.js", "js/notas.js", "js/faltas.js", "js/comunidad.js", "js/estudio.js",
  "js/herramientas.js", "js/python.js", "js/estada.js", "js/extras.js", "js/editor.js", "js/formularios.js", "js/push.js", "js/herr-redes.js", "js/herr-sistemas.js", "js/herr-seguridad.js", "js/herr-hardware.js", "js/biblioteca.js", "js/herr-guias.js", "js/herr-extra.js", "js/herr-pasos.js", "js/sandbox.js", "js/sb-terminal.js", "js/sb-linux.js", "js/sb-windows.js", "js/sb-git.js", "js/sb-python.js", "js/sb-codigo.js", "js/sb-guias.js",
  "manifest.webmanifest", "img/icono-192.png", "img/icono-512.png", "img/favicon.png",
  "img/logo-digitech.png", "img/logo-digitech-blanco.png", "img/badge-96.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== VERSION && !k.startsWith("mochila-sandbox")) /* Linux del Sandbox: se queda */.map((k) => caches.delete(k))))
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

// ---------- Notificaciones push (llegan aunque la app esté cerrada) ----------
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { texto: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Mochila SMX", {
    body: d.texto || "",
    // Icono grande (el de la app) y el pequeño de la barra de estado (Android: blanco sobre transparente)
    icon: new URL("img/icono-192.png", self.registration.scope).href,
    badge: new URL("img/badge-96.png", self.registration.scope).href,
    vibrate: [120, 60, 120],
    tag: d.tag || undefined,
    data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
    const misma = ventanas.find((v) => v.url.split("#")[0] === destino.split("#")[0]);
    if (misma) { misma.navigate(destino).catch(() => {}); return misma.focus(); }
    return self.clients.openWindow(destino);
  }));
});
