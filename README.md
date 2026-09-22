# 🎒 Mochila SMX

**Mi portfolio y organizador del ciclo de Sistemas Microinformáticos y Redes (2º SMX · Digitech Barcelona).**

Una app web instalable donde guardo mi día a día en clase, los apuntes de cada materia, mis trabajos, la formación extra (Cisco, certificaciones…) y mi calendario y horario. La pueden ver mis profes y mi familia con una contraseña, y todo el contenido va **cifrado**.

🔗 **Ver la app:** https://lorena639.github.io/mochila-smx-app/
✏️ **Modo edición (solo yo):** https://lorena639.github.io/mochila-smx-app/admin.html

---

## ✨ Qué tiene

| Sección | Qué hay |
|---|---|
| 🏠 **Inicio** | Resumen del día: mis clases de hoy, próximas entregas y exámenes, tablón con notas de clase, últimas publicaciones y trabajos. Fila de "historias" con cada materia. |
| 📸 **Día a día** | Estilo Instagram: perfil con foto, destacados por etiqueta, cuadrícula de fotos o feed con carrusel, visor a pantalla completa, **me gusta** y **comentarios**. |
| 📚 **Materias** | Una ficha por asignatura con **apuntes** (texto con formato + PDFs), **trabajos** de esa materia e **información** (teoría general y horas de clase). |
| 🗂️ **Trabajos** | Todos mis trabajos con archivos adjuntos, filtrables por materia y estado. Al escribir el título, la app **propone sola** la materia y el tipo. |
| 🎓 **Formación** | Cursos de Cisco NetAcad, certificaciones y titulaciones, con horas y certificado. |
| 📅 **Calendario** | Vista mensual con entregas, exámenes y festivos + **horario semanal** a escala. |

**Además:**
- 📲 **Se instala como app** en PC y móvil (PWA) y funciona sin conexión.
- 👤 **Cuentas sin email:** quien entra pone su nombre y si es profe, familia o compañero; su dispositivo lo recuerda.
- 👀 **Quién ha entrado:** en modo edición veo las últimas visitas.
- 💾 **Guardado automático** a los 2 segundos de cada cambio, con copia local si se va internet.
- 🗜️ Las fotos se **comprimen solas** antes de subirse.
- 🌙 **Modo oscuro** automático.

---

## 🔒 Cómo funciona la seguridad

El repositorio es público (GitHub Pages gratis lo necesita), pero **el contenido no se puede leer sin la contraseña**:

- Los datos (`data/datos.enc.json`), los archivos (`data/archivos/`) y los comentarios se cifran en el navegador con **AES-256-GCM**, usando una clave derivada de la contraseña con **PBKDF2 (310.000 iteraciones, SHA-256)**.
- La contraseña **no se guarda en ningún sitio**: ni en el código, ni en GitHub, ni en Supabase.
- Para **editar** hace falta además un **token de GitHub** con permiso solo sobre este repositorio. Sin él nadie puede cambiar nada.
- Los visitantes solo pueden **leer**, comentar y dar "me gusta".

> ⚠️ El nombre que pone quien comenta no se verifica: es una "cuenta" de confianza, pensada para profes y familia.

---

## 🛠️ Tecnologías

- **HTML, CSS y JavaScript** puros (módulos ES), sin frameworks ni compilación.
- **Web Crypto API** para el cifrado.
- **GitHub Pages** para publicar y la **API de GitHub** para guardar desde el navegador.
- **Supabase** (REST) para comentarios, me gusta y visitas.
- **Service Worker + Web App Manifest** para instalarla como app.

---

## 📁 Estructura

```
mochila-smx-app/
├── index.html                   → Entrada para visitantes (contraseña + "¿quién eres?")
├── admin.html                   → Entrada para editar (token de GitHub + contraseña)
├── manifest.webmanifest         → App para visitantes
├── manifest-admin.webmanifest   → App de edición (se abre en admin.html)
├── sw.js                        → Service worker: app instalable y sin conexión
├── css/
│   └── estilos.css              → Todo el diseño (colores de Digitech)
├── js/
│   ├── config.js                → ⚙️ Datos de Supabase
│   ├── app.js                   → Arranque para visitantes
│   ├── admin.js                 → Arranque del modo edición + guardado automático
│   ├── nucleo.js                → El "motor": menú, navegación, clics, visor de fotos
│   ├── vistas.js                → Dibuja cada sección
│   ├── formularios.js           → Ventanas de añadir / editar
│   ├── archivos.js              → Subir, comprimir y descargar archivos cifrados
│   ├── comentarios.js           → Comentarios, me gusta y visitas (Supabase)
│   ├── github.js                → Lee y escribe en este repositorio
│   ├── comun.js                 → Cifrado, fechas, formato de texto, clasificador
│   └── iconos.js                → Iconos SVG
├── data/
│   ├── datos.enc.json           → Todo el contenido, CIFRADO
│   └── archivos/                → Fotos, PDFs y trabajos, CIFRADOS
└── img/                         → Logos e iconos de la app
```

---

## 📖 Guía de uso (para mí)

### Editar
1. Abre **admin.html** (o la app instalada de edición).
2. Pega el **token de GitHub** y marca *Recordar en este ordenador*.
3. Escribe la **contraseña de la web**.
4. Usa los botones **+ Añadir** y ✏️ de cada sección. Se guarda solo: arriba pone **Todo guardado**.

### Escribir con formato (apuntes, posts, descripciones)
```
## Título de un apartado
- punto de una lista
**negrita**   *cursiva*   `comando`
[texto del enlace](https://…)
```
Para un bloque de código, escríbelo entre dos líneas con tres acentos graves (```).

### Compartir
- Profes y familia: enlace **https://lorena639.github.io/mochila-smx-app/** + la contraseña (por separado).
- **Nunca** compartir el token ni el enlace de `admin.html`.

### Instalar como app
- **PC (Edge/Chrome):** ··· → Aplicaciones → Instalar este sitio como aplicación.
- **Android (Chrome):** ⋮ → Instalar aplicación (o *Crear acceso directo*).
- **iPhone (Safari):** Compartir → Añadir a pantalla de inicio.

### Actualizar el código
Subir los archivos nuevos con **Add file → Upload files** (respetando las carpetas `css` y `js`) → **Commit changes**. En 1–2 minutos le llega a todo el mundo, sin reinstalar nada.

---

## ⚙️ Configuración

### Token de GitHub
*Settings → Developer settings → Personal access tokens → Fine-grained tokens* → con acceso a **mochila-smx-app** y permiso **Contents: Read and write**.

### Supabase (comentarios, me gusta y visitas)
Tabla creada con:

```sql
create table comentarios (
  id uuid primary key default gen_random_uuid(),
  post text not null check (char_length(post) <= 64),
  datos jsonb not null check (pg_column_size(datos) < 20000),
  creado timestamptz not null default now()
);
alter table comentarios enable row level security;
create policy "leer" on comentarios for select to anon using (true);
create policy "escribir" on comentarios for insert to anon with check (true);
```

La URL del proyecto y la clave **publishable** van en `js/config.js`. La clave publishable es pública por diseño; la **secret** nunca va en el código.

> Esta app comparte proyecto de Supabase con `mochila-smx`, así que los comentarios de los posts que existen en las dos se ven en ambas.

---

Hecho por **Lorena** · 2º SMX · Digitech Barcelona
