// =============================================================
//  asistencia.js — Fichaje de entrada y salida por ubicación
//
//  · Al fichar, el móvil mira el GPS y comprueba que estás cerca del
//    instituto (radio configurable). Si no, no deja fichar.
//  · El fichaje se guarda en Supabase cifrado con una clave propia
//    (config.claves.fichajes) que solo tienen tú y los grupos a los
//    que dejes ver "Asistencia" (normalmente, Familia).
//  · La hora que cuenta es la del servidor (no la del móvil).
//  · No se guarda tu posición exacta: solo la distancia al instituto.
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";
import * as comentarios from "./comentarios.js";
import { clasesDeFecha } from "./curso.js";
import { htmlModulosFaltas, htmlPropuestas, htmlListaFaltas, racha } from "./faltas.js";

export const RADIO_DEFECTO = 200; // metros
const MARGEN_TARDE = 10;          // minutos de cortesía

// ---------- Geolocalización ----------
export function distancia(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const textoDistancia = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);

export function posicion() {
  return new Promise((ok, mal) => {
    if (!("geolocation" in navigator)) return mal(new Error("Este navegador no puede usar la ubicación."));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude, precision: p.coords.accuracy }),
      (err) => mal(new Error(
        err.code === 1 ? "No has dado permiso de ubicación. Actívalo en los ajustes del navegador para esta web." :
        err.code === 3 ? "El GPS ha tardado demasiado. Prueba otra vez (mejor cerca de una ventana)." :
        "No se ha podido saber dónde estás. Revisa que la ubicación del móvil esté activada.")),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}

// Comprueba la ubicación y guarda el fichaje. accion: "entrada" | "salida"
export async function fichar({ accion, instituto, clave, metodo = "app" }) {
  if (!instituto?.lat || !instituto?.lon) throw new Error("Primero guarda la ubicación del instituto.");
  if (!clave) throw new Error("Falta la clave de fichajes.");
  const p = await posicion();
  const dist = Math.round(distancia(p, instituto));
  const prec = Math.round(p.precision);
  const radio = Number(instituto.radio) || RADIO_DEFECTO;
  if (prec > 500) throw new Error(`El GPS no es preciso ahora (±${prec} m). Espera unos segundos o acércate a una ventana y prueba otra vez.`);
  if (dist - Math.min(prec, 150) > radio) throw new Error(`Estás a ${textoDistancia(dist)} del instituto. Solo se puede fichar a menos de ${radio} m.`);
  const registro = { tipo: "fichaje", accion, hora: new Date().toISOString(), distancia: dist, precision: prec, metodo };
  await comentarios.guardarFichaje(registro, clave);
  return registro;
}

// ---------- Cálculos ----------
const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
const diaSemana = (f) => ((f.getDay() + 6) % 7) + 1;
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const horaDe = (f) => new Date(f.creado).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const minDe = (f) => { const d = new Date(f.creado); return d.getHours() * 60 + d.getMinutes(); };
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Primera clase del día (o null si no hay clase)
function primeraClase(d, fecha) {
  return clasesDeFecha(d, fecha)[0] || null;
}

// Agrupa los fichajes por día (fecha local)
export function porDia(fichajes = []) {
  const m = new Map();
  for (const f of fichajes) {
    const k = iso(new Date(f.creado));
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(f);
  }
  for (const l of m.values()) l.sort((a, b) => a.creado.localeCompare(b.creado));
  return m;
}

// Estado de un día: { clase: "ok"|"tarde"|"falta"|"pendiente"|"libre"|"futuro", texto, entrada, salida }
export function estadoDia(d, dias, fecha) {
  const hoy = iso(new Date());
  const lista = dias.get(fecha) || [];
  const entrada = lista.find((f) => f.accion === "entrada");
  const salida = [...lista].reverse().find((f) => f.accion === "salida");
  const clase = primeraClase(d, fecha);
  if (entrada) {
    const retraso = clase ? minDe(entrada) - aMin(clase.inicio) : 0;
    const tarde = clase && retraso > MARGEN_TARDE;
    return { clase: tarde ? "tarde" : "ok", entrada, salida, retraso,
      texto: `Llegó a las ${horaDe(entrada)}${tarde ? ` (${retraso} min tarde)` : ""}${salida ? ` · salió a las ${horaDe(salida)}` : ""}` };
  }
  if (!clase) return { clase: "libre", texto: "No hay clase" };
  if (fecha > hoy) return { clase: "futuro", texto: `Clase a las ${clase.inicio}` };
  if (fecha === hoy) {
    const n = new Date();
    const ahora = n.getHours() * 60 + n.getMinutes();
    if (ahora < aMin(clase.inicio) + MARGEN_TARDE) return { clase: "pendiente", texto: `Todavía no ha fichado (clase a las ${clase.inicio})` };
  }
  return { clase: "falta", texto: "Sin fichaje" };
}

// Resumen desde el primer fichaje (antes no existía el sistema)
function resumen(d, dias, desde, hasta) {
  let lectivos = 0, fichados = 0, tarde = 0;
  const f = new Date(desde + "T00:00:00");
  const fin = new Date(hasta + "T00:00:00");
  for (; f <= fin; f.setDate(f.getDate() + 1)) {
    const est = estadoDia(d, dias, iso(f));
    if (est.clase === "libre" || est.clase === "futuro" || est.clase === "pendiente") continue;
    lectivos++;
    if (est.clase === "ok" || est.clase === "tarde") fichados++;
    if (est.clase === "tarde") tarde++;
  }
  return { lectivos, fichados, tarde, porcentaje: lectivos ? Math.round((fichados / lectivos) * 100) : null };
}

// =============================================================
//  Vistas
// =============================================================
const ESTADO = { ok: ["A tiempo", "ok"], tarde: ["Tarde", "aviso"], falta: ["Sin fichaje", "mal"], pendiente: ["Pendiente", "acento"], libre: ["Sin clase", ""], futuro: ["Próximamente", ""] };
const chipEstado = (c) => `<span class="chip ${ESTADO[c][1]}"><span class="p"></span>${ESTADO[c][0]}</span>`;

// Tarjeta pequeña para Inicio
export function panelInicio(e) {
  const d = e.datos;
  const hoy = iso(new Date());
  const est = e.fichajes ? estadoDia(d, porDia(e.fichajes), hoy) : null;
  return `<section class="panel asistencia-mini ${est ? "estado-" + est.clase : ""}">
    <div class="panel-titulo"><h2>${icono("ubicacion")} Asistencia de hoy</h2>
      <button class="enlace-ver" type="button" data-ir="asistencia">Ver ${icono("flecha")}</button></div>
    ${!est ? `<p class="texto-suave">${e.errorFichajes ? esc(e.errorFichajes) : "Cargando…"}</p>` : `<p class="asistencia-hoy">${chipEstado(est.clase)}<span>${esc(est.texto)}</span></p>`}
    ${e.fichajes ? `<p class="texto-suave racha">${(() => { const n = racha(d, e.fichajes); return n ? `Racha: <b>${n} ${n === 1 ? "día" : "días"}</b> seguidos llegando a tiempo` : ""; })()}</p>` : ""}
    ${e.editor ? botonesFichar(e, est) : ""}
  </section>`;
}

function botonesFichar(e, est) {
  if (!e.datos.config.instituto?.lat) return `<p class="nota">Configura la ubicación del instituto en <a href="#asistencia">Asistencia</a>.</p>`;
  const yaEntrada = est && (est.clase === "ok" || est.clase === "tarde");
  return `<div class="fichar-botones">
    <button class="boton ${yaEntrada ? "" : "principal"}" type="button" data-fichar="entrada" ${e.fichando ? "disabled" : ""}>${icono("ubicacion")} Fichar entrada</button>
    <button class="boton ${yaEntrada ? "principal" : ""}" type="button" data-fichar="salida" ${e.fichando ? "disabled" : ""}>Fichar salida</button>
  </div>`;
}

export function vistaAsistencia(e) {
  const d = e.datos;
  const nombre = esc(d.config.nombre || "Lorena");
  const cab = `<header class="cabecera-seccion"><div><h1>Asistencia</h1>
    <p>${e.editor ? "Ficha al llegar y al salir del instituto. Tu familia lo verá al momento." : `Cuándo llega ${nombre} al instituto. Se ficha con la ubicación del móvil al llegar.`}</p></div></header>`;
  const faltas = `${htmlPropuestas(e)}
    <section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Faltas por módulo</h2></div>
      <p class="texto-suave">Límite del centro: más del 15 % de faltas injustificadas en un módulo hace perder la evaluación continua, y hay que asistir al 80 %. Tres retrasos cuentan como una falta.</p>
      ${htmlModulosFaltas(e)}</section>
    ${htmlListaFaltas(e)}`;
  if (!e.fichajes) return `${cab}<div class="vacio">${e.errorFichajes ? esc(e.errorFichajes) : comentarios.activos() ? "Cargando fichajes…" : "El fichaje necesita Supabase configurado."}</div>${faltas}${e.editor ? ajustes(e) : ""}`;

  const dias = porDia(e.fichajes);
  const hoy = iso(new Date());
  const est = estadoDia(d, dias, hoy);
  const primero = e.fichajes.length ? iso(new Date(e.fichajes[e.fichajes.length - 1].creado)) : null;
  const { anio, mes } = e.cal;
  const iniMes = iso(new Date(anio, mes, 1));
  const finMes = iso(new Date(anio, mes + 1, 0));
  const rMes = primero ? resumen(d, dias, primero > iniMes ? primero : iniMes, finMes < hoy ? finMes : hoy) : null;
  const rTotal = primero ? resumen(d, dias, primero, hoy) : null;

  const tarjetaHoy = `<section class="panel asistencia-hoy-grande estado-${est.clase}">
      <small>Hoy · ${esc(mayus(new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })))}</small>
      <p class="asistencia-hoy">${chipEstado(est.clase)}<span>${esc(est.texto)}</span></p>
      ${est.entrada ? `<small class="texto-suave">Fichado con GPS a ${textoDistancia(est.entrada.distancia || 0)} del instituto${est.entrada.metodo === "auto" ? " · automático" : ""}</small>` : ""}
      ${e.editor ? botonesFichar(e, est) : ""}
    </section>`;

  const cifra = (r, titulo) => `<div class="cifra"><b>${r && r.porcentaje !== null ? r.porcentaje + "%" : "—"}</b>
    <span>${titulo}</span><small>${r ? `${r.fichados} de ${r.lectivos} ${r.lectivos === 1 ? "día" : "días"} con clase${r.tarde ? ` · ${r.tarde} tarde` : ""}` : "Aún sin fichajes"}</small></div>`;
  const tarjetaResumen = `<section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Resumen</h2></div>
    <div class="cifras">${cifra(rMes, "Este mes")}${cifra(rTotal, "Desde el inicio")}</div>
    ${(() => { const n = racha(d, e.fichajes); return n ? `<p class="racha"><b>${n} ${n === 1 ? "día" : "días"}</b> seguidos llegando a tiempo</p>` : ""; })()}
    <p class="nota">Cuentan los días con clase según el horario, sin festivos, desde el primer fichaje.</p></section>`;

  // Calendario del mes con colores
  const primeroMes = new Date(anio, mes, 1);
  const inicio = new Date(primeroMes); inicio.setDate(1 - (diaSemana(primeroMes) - 1));
  let celdas = ["L", "M", "X", "J", "V", "S", "D"].map((x) => `<div class="cal-dia-semana">${x}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const f = new Date(inicio); f.setDate(inicio.getDate() + i);
    const k = iso(f);
    const s = primero && k >= primero ? estadoDia(d, dias, k) : { clase: primeraClase(d, k) ? (k > hoy ? "futuro" : "antes") : "libre", texto: "" };
    const dentro = s.entrada ? horaDe(s.entrada) : "";
    celdas += `<div class="asis-dia estado-${s.clase} ${f.getMonth() !== mes ? "fuera" : ""} ${k === hoy ? "hoy" : ""}" title="${esc(s.texto || "")}">
      <span class="num">${f.getDate()}</span>${dentro ? `<small>${dentro}</small>` : ""}</div>`;
  }
  const calendario = `<section class="panel">
    <div class="cal-cabecera">
      <button type="button" class="boton icono" data-mes="-1" aria-label="Mes anterior">${icono("flecha-izq")}</button>
      <h2>${esc(mayus(primeroMes.toLocaleDateString("es-ES", { month: "long" })))} ${anio}</h2>
      <button type="button" class="boton icono" data-mes="1" aria-label="Mes siguiente">${icono("flecha-der")}</button>
    </div>
    <div class="asis-rejilla">${celdas}</div>
    <div class="leyenda"><span class="estado-ok">A tiempo</span><span class="estado-tarde">Tarde</span><span class="estado-falta">Sin fichaje</span><span class="estado-libre">Sin clase</span></div>
  </section>`;

  const ultimos = e.fichajes.slice(0, 12);
  const lista = `<section class="panel"><div class="panel-titulo"><h2>${icono("reloj")} Últimos fichajes</h2></div>
    ${ultimos.length ? `<ul class="lista-fichajes">${ultimos.map((f) => `<li><b>${f.accion === "salida" ? "Salida" : "Entrada"}</b>
      <span>${esc(new Date(f.creado).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }))} · ${horaDe(f)}</span>
      <small>a ${textoDistancia(f.distancia || 0)}${f.metodo === "auto" ? " · automático" : ""}</small></li>`).join("")}</ul>`
      : `<p class="texto-suave">${e.editor ? "Todavía no has fichado nunca. El primer fichaje empieza a contar." : "Todavía no hay fichajes."}</p>`}</section>`;

  return `${cab}<div class="asistencia-zona">${tarjetaHoy}${tarjetaResumen}</div>
    ${faltas}
    <div class="asistencia-zona">${calendario}${lista}</div>${e.editor ? ajustes(e) : ""}`;
}

// ---------- Ajustes (solo tú) ----------
export function enlaceFichaje(d, auto = "") {
  const i = d.config.instituto || {};
  const base = new URL("fichar.html", location.href.split("#")[0]).href;
  const p = new URLSearchParams({ k: d.config.claves.fichajes, lat: i.lat, lon: i.lon, r: i.radio || RADIO_DEFECTO, n: d.config.nombre || "" });
  if (auto) p.set("auto", auto);
  return `${base}#${p.toString()}`;
}

function ajustes(e) {
  const i = e.datos.config.instituto || {};
  const listo = i.lat && i.lon;
  return `<section class="panel ajustes-fichaje">
    <div class="panel-titulo"><h2>${icono("ajustes")} Ajustes del fichaje</h2></div>
    <form class="rejilla-form" data-form="instituto">
      <p class="nota ancho">Ubicación del instituto. Lo más fácil: <b>cuando estés en Digitech</b>, pulsa «Estoy en el instituto».
        También puedes copiar las coordenadas desde Google Maps (clic derecho sobre el edificio).</p>
      <div class="campo"><label for="insLat">Latitud</label><input id="insLat" name="lat" inputmode="decimal" value="${esc(i.lat ?? "")}" placeholder="41.40…"></div>
      <div class="campo"><label for="insLon">Longitud</label><input id="insLon" name="lon" inputmode="decimal" value="${esc(i.lon ?? "")}" placeholder="2.19…"></div>
      <div class="campo"><label for="insRadio">Radio (metros)</label><input id="insRadio" name="radio" type="number" min="50" max="1000" step="10" value="${esc(i.radio || RADIO_DEFECTO)}"></div>
      <div class="fila-botones">
        <button class="boton" type="button" data-accion="aqui">${icono("ubicacion")} Estoy en el instituto</button>
        <button class="boton principal" type="submit">Guardar ubicación</button>
      </div>
    </form>
    ${listo ? `<hr>
    <h3>Fichaje automático al llegar</h3>
    <p class="nota">El móvil puede fichar solo cuando llegas. Guarda este enlace en una automatización (instrucciones abajo).
      <b>Es secreto:</b> con él se puede fichar en tu nombre, no lo compartas.</p>
    <div class="fila-botones">
      <button class="boton principal" type="button" data-copiar-enlace="entrada">Copiar enlace de llegada</button>
      <button class="boton" type="button" data-copiar-enlace="salida">Copiar enlace de salida</button>
      <button class="boton" type="button" data-copiar-enlace="">Copiar enlace normal</button>
    </div>
    <details class="instrucciones"><summary>iPhone (app Atajos)</summary><ol>
      <li>Abre <b>Atajos</b> → <b>Automatización</b> → <b>+</b> → <b>Llegar</b>.</li>
      <li>Ubicación: busca Digitech Barcelona. Hora: cualquier momento. Marca <b>Ejecutar inmediatamente</b> si te sale.</li>
      <li>Acción: <b>Abrir URLs</b> → pega el <b>enlace de llegada</b>.</li>
      <li>Opcional: otra automatización con <b>Salir</b> y el <b>enlace de salida</b>.</li></ol></details>
    <details class="instrucciones"><summary>Android (app MacroDroid, gratis)</summary><ol>
      <li>Instala <b>MacroDroid</b> → <b>Añadir macro</b>.</li>
      <li>Disparador: <b>Ubicación → Geovalla</b> → marca el instituto (radio 150 m) → <b>Entrar en zona</b>.</li>
      <li>Acción: <b>Aplicaciones → Abrir página web</b> → pega el <b>enlace de llegada</b>.</li>
      <li>Opcional: otra macro con <b>Salir de zona</b> y el <b>enlace de salida</b>.</li></ol></details>
    <p class="nota">El enlace abre una página que comprueba el GPS y ficha. Si no estás cerca, no ficha.</p>` : ""}
  </section>`;
}
