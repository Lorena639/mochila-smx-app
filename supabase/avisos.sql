-- =============================================================
--  Notificaciones push de Mochila SMX
--  Pégalo en Supabase → SQL Editor → New query → Run.
--  Las tablas NO tienen políticas: solo las lee la función "avisos"
--  (con la clave de servicio). Desde la web no se pueden leer.
-- =============================================================
create table if not exists avisos_suscripciones (
  endpoint text primary key,
  sub jsonb not null,
  quien text,
  creado timestamptz not null default now()
);

create table if not exists avisos_recordatorios (
  id text primary key,
  cuando timestamptz not null,
  titulo text not null,
  texto text not null,
  url text not null default './',
  enviado boolean not null default false
);
create index if not exists avisos_recordatorios_pendientes on avisos_recordatorios (enviado, cuando);

create table if not exists avisos_config (
  id text primary key,
  valor jsonb not null
);

alter table avisos_suscripciones enable row level security;
alter table avisos_recordatorios enable row level security;
alter table avisos_config enable row level security;
