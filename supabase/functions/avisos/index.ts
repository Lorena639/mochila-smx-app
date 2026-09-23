// =============================================================
//  Función "avisos" (Supabase Edge Function)
//  Manda las notificaciones push a los móviles apuntados.
//  · La llama la app (apuntarse, prueba, programar recordatorios)
//  · La llama un Database Webhook al insertar en "comentarios"
//    (fichajes, foro, buzón, comentarios)
//  · La llama un Cron cada 15 minutos (recordatorios)
//  Necesita UN secreto: AVISOS_CLAVE (el que te da la app).
//  Las claves VAPID se crean solas la primera vez.
// =============================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const CLAVE = Deno.env.get("AVISOS_CLAVE") ?? "";
const CONTACTO = Deno.env.get("AVISOS_CONTACTO") ?? "https://lorena639.github.io/mochila-smx-app/";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-avisos",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---------- Claves VAPID (se generan una vez y se guardan) ----------
let vapidCache: { publicKey: string; privateKey: string } | null = null;
async function vapid() {
  if (vapidCache) return vapidCache;
  const leer = async () => (await db.from("avisos_config").select("valor").eq("id", "vapid").maybeSingle()).data?.valor;
  let v = await leer();
  if (!v) {
    await db.from("avisos_config").upsert({ id: "vapid", valor: webpush.generateVAPIDKeys() }, { onConflict: "id", ignoreDuplicates: true });
    v = await leer();
  }
  vapidCache = v;
  webpush.setVapidDetails(CONTACTO, v.publicKey, v.privateKey);
  return v;
}

// ---------- Enviar a todos los móviles apuntados ----------
async function enviar(titulo: string, texto: string, url = "./", tag = "") {
  await vapid();
  const { data: subs } = await db.from("avisos_suscripciones").select("endpoint, sub");
  let ok = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(s.sub, JSON.stringify({ titulo, texto, url, tag }), { TTL: 60 * 60 * 24 });
      ok++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("avisos_suscripciones").delete().eq("endpoint", s.endpoint);
    }
  }));
  return ok;
}

// ---------- Filas nuevas en "comentarios" (Database Webhook) ----------
const horaMadrid = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

async function porFila(r: { post?: string; datos?: Record<string, unknown>; creado?: string }) {
  const creado = r.creado ?? new Date().toISOString();
  // Fichajes añadidos a mano de días pasados: sin aviso
  if (Date.now() - new Date(creado).getTime() > 10 * 60 * 1000) return 0;
  const aviso = r.datos?.aviso;
  if (r.post === "_fichajes") {
    if (aviso === "entrada") return enviar("Entrada al instituto", `Fichada a las ${horaMadrid(creado)}`, "./#asistencia", "fichaje");
    if (aviso === "salida") return enviar("Salida del instituto", `Fichada a las ${horaMadrid(creado)}`, "./#asistencia", "fichaje");
    return 0;
  }
  if (r.post === "_foro") return enviar("Comunidad", "Hay un mensaje nuevo en el foro", "./#comunidad", "foro");
  if (r.post === "_buzon") return enviar("Buzón", "Ha llegado un mensaje nuevo al buzón", "./admin.html#buzon", "buzon");
  if (r.post === "_buzon_r") return enviar("Buzón", "Lorena ha respondido a un mensaje del buzón", "./#buzon", "buzon");
  if (aviso === "comentario") return enviar("Comentario nuevo", "Alguien ha comentado una publicación", "./#diario", "comentario");
  return 0;
}

// ---------- Recordatorios (exámenes, entregas, faltas) ----------
type Rec = { id: string; cuando: string; titulo: string; texto: string; url?: string };
async function programar(lista: Rec[]) {
  lista = (lista ?? []).slice(0, 400).filter((r) => r?.id && r.cuando && !isNaN(Date.parse(r.cuando)));
  const ids = lista.map((r) => String(r.id).slice(0, 120));
  // Los pendientes que ya no están (borrados o cambiados de fecha) se quitan
  const { data: pend } = await db.from("avisos_recordatorios").select("id").eq("enviado", false);
  const sobran = (pend ?? []).map((p) => p.id).filter((id) => !ids.includes(id));
  if (sobran.length) await db.from("avisos_recordatorios").delete().in("id", sobran);
  // Los ya enviados no se vuelven a mandar
  const { data: env } = ids.length ? await db.from("avisos_recordatorios").select("id").eq("enviado", true).in("id", ids) : { data: [] };
  const hechos = new Set((env ?? []).map((x) => x.id));
  const filas = lista.filter((r) => !hechos.has(String(r.id).slice(0, 120))).map((r) => ({
    id: String(r.id).slice(0, 120),
    cuando: new Date(r.cuando).toISOString(),
    titulo: String(r.titulo).slice(0, 80),
    texto: String(r.texto).slice(0, 200),
    url: String(r.url || "./").slice(0, 200),
    enviado: false,
  }));
  if (filas.length) await db.from("avisos_recordatorios").upsert(filas, { onConflict: "id" });
  return filas.length;
}

async function cron() {
  const ahora = new Date();
  const { data } = await db.from("avisos_recordatorios").select("*").eq("enviado", false)
    .lte("cuando", ahora.toISOString()).order("cuando").limit(20);
  let n = 0;
  for (const r of data ?? []) {
    // Si se quedó atrás más de 12 h (p. ej. el cron estuvo parado), no se manda tarde
    if (ahora.getTime() - new Date(r.cuando).getTime() < 12 * 3600 * 1000) n += await enviar(r.titulo, r.texto, r.url, r.id);
    await db.from("avisos_recordatorios").update({ enviado: true }).eq("id", r.id);
  }
  const hace60 = new Date(ahora.getTime() - 60 * 86400 * 1000).toISOString();
  await db.from("avisos_recordatorios").delete().eq("enviado", true).lt("cuando", hace60);
  return n;
}

// ---------- Entrada ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!CLAVE) return json({ error: "Falta el secreto AVISOS_CLAVE en Supabase." }, 500);
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* sin cuerpo */ }
  if ((req.headers.get("x-avisos") ?? body.clave) !== CLAVE) return json({ error: "Clave de avisos incorrecta." }, 401);
  try {
    if (body.type === "INSERT" && body.record) return json({ enviados: await porFila(body.record) });
    switch (body.accion) {
      case "publica": return json({ publica: (await vapid()).publicKey });
      case "suscribir": {
        const sub = body.sub;
        if (!sub?.endpoint || !sub?.keys?.p256dh) return json({ error: "Suscripción no válida." }, 400);
        await db.from("avisos_suscripciones").upsert({ endpoint: sub.endpoint, sub, quien: String(body.quien ?? "").slice(0, 40) }, { onConflict: "endpoint" });
        return json({ ok: true });
      }
      case "baja":
        if (body.endpoint) await db.from("avisos_suscripciones").delete().eq("endpoint", body.endpoint);
        return json({ ok: true });
      case "probar": return json({ enviados: await enviar("Mochila SMX", "Las notificaciones funcionan en este móvil.", "./", "prueba") });
      case "programar": return json({ programados: await programar(body.recordatorios) });
      case "cron": return json({ enviados: await cron() });
      case "estado": {
        const { count } = await db.from("avisos_suscripciones").select("*", { count: "exact", head: true });
        return json({ moviles: count ?? 0 });
      }
    }
    return json({ error: "Acción desconocida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
