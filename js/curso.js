// =============================================================
//  curso.js — Datos oficiales del curso 2026-27 (2º CFGM SMX)
//   · Calendario académico de Digitech Barcelona
//   · Días sin clase y horas reales de cada módulo
//   · Resultados de aprendizaje (RA) del currículo IC10
// =============================================================

export const CURSO = { inicio: "2026-09-21", fin: "2027-05-21" };

// Tipos de fecha que significan "no hay clase"
export const TIPOS_SIN_CLASE = ["Festivo", "Vacaciones", "Sin clase"];

// ---------- Calendario académico 2026-27 (solo lo que afecta a 2º CFGM) ----------
const ev = (id, fecha, titulo, tipo, extra = {}) => ({ id: "of-" + id, fecha, titulo, tipo, asignatura: "", nota: "", oficial: true, ...extra });
export const CALENDARIO_OFICIAL = [
  ev("inicio", "2026-09-21", "Inicio del curso", "Evaluación"),
  ev("conval", "2026-09-22", "Solicitud de convalidaciones", "Trámite", { fechaFin: "2026-09-30", nota: "Hasta el 30/09" }),
  ev("merce", "2026-09-24", "La Mercè", "Festivo"),
  ev("hispanitat", "2026-10-12", "Día de la Hispanidad", "Festivo"),
  ev("lld1", "2026-10-30", "Día de libre disposición", "Sin clase"),
  ev("fin1", "2026-11-30", "Último día de la 1ª evaluación", "Evaluación"),
  ev("juntas1", "2026-12-01", "Juntas de la 1ª evaluación", "Sin clase", { fechaFin: "2026-12-02" }),
  ev("inicio2", "2026-12-03", "Inicio de la 2ª evaluación", "Evaluación"),
  ev("butlleti1", "2026-12-04", "Boletines de la 1ª evaluación en Alexia", "Evaluación", { fechaFin: "2026-12-09" }),
  ev("lld2", "2026-12-07", "Día de libre disposición", "Sin clase"),
  ev("purissima", "2026-12-08", "La Purísima", "Festivo"),
  ev("nadal", "2026-12-22", "Vacaciones de Navidad", "Vacaciones", { fechaFin: "2027-01-07" }),
  ev("pendents", "2027-01-18", "Exámenes de módulos pendientes de 1º", "Examen", { fechaFin: "2027-01-20", asignatura: "python" }),
  ev("exempcions", "2027-02-01", "Solicitud de exención de prácticas", "Trámite", { fechaFin: "2027-02-05" }),
  ev("lld3", "2027-02-08", "Día de libre disposición", "Sin clase"),
  ev("fin2", "2027-02-26", "Último día de la 2ª evaluación", "Evaluación"),
  ev("juntas2", "2027-03-01", "Juntas de la 2ª evaluación", "Sin clase", { fechaFin: "2027-03-02" }),
  ev("inicio3", "2027-03-03", "Inicio de la 3ª evaluación", "Evaluación"),
  ev("butlleti2", "2027-03-05", "Boletines de la 2ª evaluación en Alexia", "Evaluación", { fechaFin: "2027-03-08" }),
  ev("setmanasanta", "2027-03-22", "Vacaciones de Semana Santa", "Vacaciones", { fechaFin: "2027-03-29" }),
  ev("lld4", "2027-05-14", "Día de libre disposición", "Sin clase"),
  ev("pasqua2", "2027-05-17", "Segunda Pascua", "Festivo"),
  ev("projectes", "2027-05-20", "Presentación de proyectos de 2º", "Entrega", { fechaFin: "2027-05-21", asignatura: "1713", sinClase: true }),
  ev("fi", "2027-05-21", "Último día de clase de 2º", "Evaluación"),
  ev("juntesord", "2027-05-25", "Juntas de la evaluación ordinaria", "Evaluación", { fechaFin: "2027-05-26" }),
  ev("notesord", "2027-05-27", "Notas de la ordinaria", "Evaluación", { fechaFin: "2027-05-28" }),
  ev("extra", "2027-05-31", "Semana de exámenes extraordinarios", "Examen", { fechaFin: "2027-06-03" }),
  ev("juntesextra", "2027-06-09", "Juntas de la extraordinaria", "Evaluación"),
  ev("notesextra", "2027-06-10", "Notas de la extraordinaria", "Evaluación", { fechaFin: "2027-06-11" }),
  ev("ficurs", "2027-06-23", "Último día del curso académico", "Evaluación"),
];

// Trimestres (para pintar el calendario)
export const TRIMESTRES = [
  { n: 1, desde: "2026-09-21", hasta: "2026-11-30" },
  { n: 2, desde: "2026-12-03", hasta: "2027-02-26" },
  { n: 3, desde: "2027-03-03", hasta: "2027-05-21" },
];
export const trimestreDe = (f) => TRIMESTRES.find((t) => f >= t.desde && f <= t.hasta)?.n || 0;

// Añade el calendario oficial una sola vez (y quita las fechas de ejemplo antiguas)
export function ponerCalendarioOficial(d) {
  if (d.config.calendarioOficial === "2627") return false;
  d.eventos = d.eventos.filter((e) => !["ev-merce", "ev-conval"].includes(e.id) && !e.id?.startsWith("of-"));
  d.eventos.push(...CALENDARIO_OFICIAL.map((e) => ({ ...e })));
  d.config.calendarioOficial = "2627";
  d.config.fechasCurso ||= { ...CURSO };
  return true;
}

// ---------- Fechas ----------
export const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
export const diaSemana = (f) => ((f.getDay() + 6) % 7) + 1; // 1 = lunes
export const aMin = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + m; };
export const cubre = (e, f) => f >= e.fecha && f <= (e.fechaFin || e.fecha);

export function noLectivo(d, f) {
  return d.eventos.some((e) => cubre(e, f) && (e.sinClase || TIPOS_SIN_CLASE.includes(e.tipo)));
}
export function motivoSinClase(d, f) {
  return d.eventos.find((e) => cubre(e, f) && (e.sinClase || TIPOS_SIN_CLASE.includes(e.tipo)));
}

// Clases de un día concreto (vacío si no hay clase)
export function clasesDeFecha(d, f) {
  const fecha = new Date(f + "T00:00:00");
  const curso = d.config.fechasCurso || CURSO;
  if (f < curso.inicio || f > curso.fin || diaSemana(fecha) > 5 || noLectivo(d, f)) return [];
  return d.horario.filter((c) => c.dia === diaSemana(fecha)).sort((a, b) => a.inicio.localeCompare(b.inicio));
}
export const horasClase = (c) => Math.round((aMin(c.fin) - aMin(c.inicio)) / 60 * 10) / 10;

// Horas de clase de cada materia en todo el curso: { idAsignatura: horas }
export function horasDelCurso(d) {
  const curso = d.config.fechasCurso || CURSO;
  const r = {};
  const f = new Date(curso.inicio + "T00:00:00");
  const fin = new Date(curso.fin + "T00:00:00");
  for (; f <= fin; f.setDate(f.getDate() + 1)) {
    for (const c of clasesDeFecha(d, iso(f))) r[c.asignatura] = (r[c.asignatura] || 0) + horasClase(c);
  }
  for (const k in r) r[k] = Math.round(r[k] * 10) / 10;
  return r;
}

// ---------- Currículo oficial SMX (IC10) ----------
// Horas oficiales, RA y si el módulo incluye Estada a l'empresa (10 %)
export const MODULOS_OFICIALES = {
  "0224": { horas: 198, estada: true, ras: [
    "Instal·la sistemes operatius en xarxa descrivint-ne les característiques i interpretant-ne la documentació tècnica.",
    "Gestiona usuaris i grups de sistemes operatius en xarxa, interpretant especificacions i aplicant eines del sistema.",
    "Realitza tasques de gestió sobre dominis identificant necessitats i aplicant eines d'administració de dominis.",
    "Gestiona els recursos compartits del sistema, interpretant especificacions i determinant nivells de seguretat.",
    "Realitza tasques de monitoratge i ús del sistema operatiu en xarxa, descrivint les eines utilitzades i identificant les principals incidències.",
    "Realitza tasques d'integració de sistemes operatius lliures i propietaris, descrivint els avantatges de compartir recursos i instal·lant programari específic.",
  ] },
  "0226": { horas: 132, estada: false, ras: [
    "Aplica mesures de seguretat passiva en sistemes informàtics descrivint característiques d'entorns i relacionant-les amb les seves necessitats.",
    "Gestiona dispositius d'emmagatzematge descrivint els procediments efectuats i aplicant tècniques per assegurar la integritat de la informació.",
    "Aplica mecanismes de seguretat activa descrivint-ne les característiques i relacionant-les amb les necessitats d'ús del sistema informàtic.",
    "Assegura la privadesa de la informació transmesa en xarxes informàtiques descrivint vulnerabilitats i instal·lant programari específic.",
    "Reconeix la legislació i normativa sobre seguretat i protecció de dades analitzant-ne les repercussions de l'incompliment.",
  ] },
  "0227": { horas: 198, estada: true, ras: [
    "Instal·la serveis de configuració dinàmica, descrivint-ne les característiques i aplicacions.",
    "Instal·la serveis de resolució de noms, descrivint-ne les característiques i aplicacions.",
    "Instal·la serveis de transferència de fitxers, descrivint-ne les característiques i aplicacions.",
    "Gestiona servidors de correu electrònic identificant-ne requeriments d'utilització i aplicant-hi criteris de configuració.",
    "Gestiona servidors web identificant-ne requeriments d'utilització i aplicant-hi criteris de configuració.",
    "Gestiona mètodes d'accés remot descrivint-ne les característiques i instal·lant-hi els serveis corresponents.",
    "Desplega xarxes sense fils segures justificant la configuració triada i descrivint els procediments d'implantació.",
    "Estableix l'accés des de xarxes locals a xarxes públiques identificant possibles escenaris i aplicant programari específic.",
  ] },
  "0228": { horas: 119, estada: true, horasRA: [30, 25, 15, 10, 10], ras: [
    "Instal·la gestors de continguts, identificant-ne les aplicacions i configurant-los segons requeriments.",
    "Instal·la sistemes de gestió d'aprenentatge a distància, descrivint-ne l'estructura del lloc i la jerarquia de directoris generada.",
    "Instal·la serveis de gestió d'arxius web, identificant-ne les aplicacions i verificant-ne la integritat.",
    "Instal·la aplicacions d'ofimàtica web, descrivint-ne les característiques i entorns d'ús.",
    "Instal·la aplicacions web d'escriptori, descrivint-ne les característiques i entorns d'ús.",
  ] },
  "1713": { horas: 198, estada: false, ras: [
    "Caracteritza les empreses del sector atenent la seva organització i el tipus de producte o servei que ofereixen.",
    "Planteja solucions a les necessitats del sector tenint en compte la seva viabilitat, els costos associats i elaborant un petit projecte.",
    "Planifica l'execució de les activitats proposades a la solució plantejada, determinant el pla d'intervenció i elaborant la documentació corresponent.",
    "Realitza el seguiment de l'execució de les activitats plantejades, verificant que es compleix amb la planificació.",
    "Transmet informació amb claredat, de manera ordenada i estructurada.",
  ] },
  "1710": { horas: 66, estada: false, ras: [
    "Planifica i posa en marxa estratègies en els diferents processos selectius d'ocupació que li permeten millorar les seves possibilitats d'inserció laboral.",
    "Aplica estratègies relacionades amb les competències personals, socials i emocionals per al desenvolupament de la seva iniciativa emprenedora i la millora de la seva ocupabilitat.",
    "Posa en pràctica les habilitats emprenedores necessàries per al desenvolupament de processos d'innovació i recerca aplicades que promouen la modernització del sector productiu cap a un model sostenible.",
    "Identifica, defineix i valida idees d'emprenedoria generadores de noves oportunitats a partir d'estratègies d'anàlisi de l'entorn socioproductiu utilitzant metodologies àgils per l'ocupabilitat.",
    "Desenvolupa un projecte emprenedor d'innovació social i/o tecnològica aplicada en col·laboració amb l'entorn.",
  ] },
};

// Módulos de 1º (para la nota final del ciclo: pones la nota que sacaste)
export const MODULOS_PRIMERO = [
  ["0221", "Muntatge i manteniment d'equips", 231],
  ["0222", "Sistemes operatius monolloc", 132],
  ["0223", "Aplicacions ofimàtiques", 198],
  ["0225", "Xarxes locals", 198],
  ["1709", "Itinerari personal per a l'ocupabilitat I", 99],
  ["1664", "Digitalització aplicada als sectors productius", 33],
  ["1708", "Sostenibilitat aplicada al sistema productiu", 33],
  ["0156", "Anglès professional", 66],
];

// Crea la estructura de notas la primera vez
export function ponerNotasIniciales(d) {
  let cambiado = false;
  d.notas ||= {};
  for (const [id, m] of Object.entries(MODULOS_OFICIALES)) {
    if (d.notas[id]) continue;
    const totalH = (m.horasRA || []).reduce((a, b) => a + b, 0);
    d.notas[id] = {
      horas: m.horas,
      estada: m.estada,
      notaEstada: "",
      ras: m.ras.map((nombre, i) => ({
        id: `RA${i + 1}`,
        nombre,
        peso: m.horasRA ? Math.round((m.horasRA[i] / totalH) * 1000) / 10 : Math.round((100 / m.ras.length) * 10) / 10,
        entradas: [],
      })),
    };
    cambiado = true;
  }
  if (!d.notasPrimero) {
    d.notasPrimero = MODULOS_PRIMERO.map(([codigo, nombre, horas]) => ({ id: codigo, codigo, nombre, horas, nota: "" }));
    cambiado = true;
  }
  return cambiado;
}
