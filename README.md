# Mochila SMX · App

**Mi app del ciclo de Sistemas Microinformáticos y Redes (2º SMX · Digitech Barcelona).**

Una app instalable (PC y móvil) para organizar el curso: día a día en fotos, apuntes, notas por RA, trabajos, asistencia, calendario oficial, herramientas de estudio y una comunidad para recibir consejos. Mi familia, mis profes y mis amigos entran cada uno con **su propia contraseña** y ven solo lo que yo decido. Todo va **cifrado**.

- App: https://lorena639.github.io/mochila-smx-app/
- Modo edición (solo yo): https://lorena639.github.io/mochila-smx-app/admin.html

> La web `mochila-smx` es un proyecto aparte y no cambia con esta app.

---

## Qué tiene

| Apartado | Qué hay |
|---|---|
| **Inicio** | Panel del día: asistencia, nota media, clases de hoy, próximo día de clase, fechas, faltas por módulo y «Pregúntame». |
| **Día a día** | Publicaciones con fotos (carrusel, visor, me gusta y comentarios), filtradas por etiqueta. |
| **Materias** | Apuntes (editor tipo Word, exportar a Word/PDF, importar .docx), trabajos, información y **Notas y RA** de cada módulo. |
| **Notas** | Calculadora con las normas del centro: RA, 40 % actividades + 60 % pruebas (las dos ≥ 5), Estada 10 %, nota del ciclo por horas. Dice **qué nota necesitas** para aprobar. |
| **Trabajos** | Con archivos, editor de texto, exportar y la casilla **«¿Has usado IA?»**. |
| **Formación** | Cisco, certificaciones, cursos. |
| **Estudiar** | Tarjetas de repaso (repetición espaciada), temporizador de estudio con estadísticas y **modo examen**. |
| **Plan Python** | Cuenta atrás al examen de pendientes (18-20/01), temario, ejercicios y **consola de Python** en el navegador. |
| **Herramientas** | Calculadora de subredes con los pasos, conversor binario/hex y chuletas de Linux, Windows, Cisco IOS y puertos. |
| **Calendario** | Calendario académico 2026-27 ya cargado (festivos, vacaciones, juntas, boletines, extraordinarias), trimestres y horario. Exporta a Google Calendar. |
| **Asistencia** | Fichaje por GPS, faltas por módulo con el **15 % / 20 %** del NOFC, retrasos (3 = 1 falta), semáforo y email de justificación. |
| **Prácticas** | Diario de la Estada a l'empresa: horas y tareas, descargable para la memoria. |
| **Comunidad** | Foro (Consejos, Preguntas, Recursos, Sugerencias) y **buzón privado** que solo leo yo. |
| **Ajustes** | Perfil, grupos, fechas del curso, avisos y copia de seguridad. |

Además: modo claro/oscuro, buscador y asistente con **Ctrl + K**, campana de avisos, menú lateral en el PC y barra inferior en el móvil.

---

## Quién ve qué

En **Ajustes → Compartir por grupos**:

| Grupo | Por defecto ve |
|---|---|
| Familia | Todo, incluidas notas y asistencia |
| Profes | Día a día, materias, trabajos, formación, calendario y tablón |
| Amigos | Día a día y formación |

- Cada grupo tiene su contraseña; al entrar, la contraseña decide el grupo.
- Se publica un archivo cifrado por grupo (`data/grupos/`) con **solo** lo que puede ver.
- En cada publicación, trabajo, apunte o fecha, **«Visible para»** permite afinar.
- **Ver como…** enseña la app exactamente como la ve cada grupo.
- Estudiar, Herramientas, Prácticas, Python y Ajustes son solo míos.
- Mi contraseña principal abre todo: no se la doy a nadie.

## Asistencia

1. En Digitech: **Asistencia → Ajustes del fichaje → Estoy en el instituto → Guardar ubicación**.
2. Fichar entrada/salida desde Inicio o Asistencia (solo funciona a menos de 200 m).
3. Opcional: fichaje automático con el **enlace de llegada** en Atajos (iPhone) o MacroDroid (Android).
4. Si un día no ficho o llego tarde, la app lo propone en **«Revisa estos días»**; al confirmarlo cuenta en el porcentaje del módulo.

Las horas de cada módulo salen del horario × el calendario oficial (142 días de clase). La asistencia oficial es la de los profes en Alexia; esto es mi control.

## Avisos

- **Campana**: exámenes y entregas de hoy y mañana, trámites que acaban, faltas al límite, días por revisar, mensajes del buzón y temas nuevos del foro.
- **Notificaciones del sistema**: al abrir la app, un aviso con lo importante del día (se activan en Ajustes).
- **Google Calendar**: Calendario → «Exportar a Google Calendar» (.ics). Exámenes y entregas llevan recordatorio la tarde anterior.

---

## Seguridad

- Datos y copias por grupo cifrados en el navegador con **AES-256-GCM** (clave derivada con **PBKDF2**, 310.000 iteraciones).
- Cada archivo subido lleva su propia clave aleatoria; cada grupo solo recibe las claves de lo que ve.
- Foro: cada tema se cifra con la clave de su público (todos / familia / profes / amigos).
- Buzón: cifrado con **clave pública (RSA-OAEP)**; solo el modo edición tiene la privada.
- Fichajes: clave propia, solo para los grupos que ven Asistencia. No se guarda la posición, solo la distancia.
- Para editar hace falta además el **token de GitHub**.
- La **copia de seguridad** va sin cifrar e incluye las contraseñas de los grupos: guárdala en un sitio seguro.

Límites conocidos: el nombre de quien comenta no se verifica; los comentarios de posts usan una clave común a todos los grupos; el GPS de un móvil se puede falsear.

---

## Estructura

```
mochila-smx-app/
├── index.html · admin.html · fichar.html · sw.js · manifest*.webmanifest
├── css/  estilos.css (base) · app.css (diseño de la app)
├── js/
│   ├── app.js / admin.js      → entrada visitante / modo edición (guardado automático, grupos)
│   ├── nucleo.js              → marco, menú, navegación, clics, buscador y avisos
│   ├── vistas.js              → Inicio, Día a día, Materias, Trabajos, Formación, Calendario
│   ├── formularios.js · editor.js → ventanas de edición y editor tipo Word
│   ├── curso.js               → calendario 2026-27, horas por módulo y RA oficiales (IC10)
│   ├── notas.js · faltas.js · asistencia.js · fichar.js
│   ├── comunidad.js · grupos.js · comentarios.js
│   ├── estudio.js · python.js · herramientas.js · estada.js · extras.js
│   ├── archivos.js · github.js · comun.js · iconos.js
│   └── config.js              → datos de Supabase (solo la clave publishable)
├── data/                      → contenido CIFRADO (datos, grupos, archivos)
└── img/
```

## Configuración

- **Token de GitHub:** fine-grained, solo `mochila-smx-app`, permiso *Contents: Read and write*.
- **Supabase:** tabla `comentarios` (la misma para comentarios, fichajes, foro y buzón), con RLS de lectura e inserción para `anon`. La clave **publishable** va en `js/config.js`; la *secret* nunca.

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

## Actualizar

Subir los archivos con **Add file → Upload files** arrastrando las carpetas `css` y `js` y los archivos sueltos → **Commit changes**. Llega a todo el mundo en 1-2 minutos sin reinstalar.

Fuentes: NOFC Digitech Barcelona (DOC001DIGBCN, 26/27), Calendari acadèmic Digitech 26/27 y currículum CFGM SMX IC10.

---

Hecho por **Lorena** · 2º SMX · Digitech Barcelona
