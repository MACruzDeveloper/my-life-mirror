-- RF-04: consentimiento explícito para categorías sensibles. Se adelanta a
-- Sprint 5 por la misma razón que 0001_profiles.sql: un repositorio en
-- memoria no sobrevive entre funciones serverless distintas, y este dato es
-- justo el tipo de cosa (RGPD) que no puede perderse entre peticiones.
--
-- La restricción unique hace cumplir a nivel de base de datos la misma
-- idempotencia por versión de política que ya valida OtorgarConsentimiento
-- en la capa de aplicación — defensa en profundidad, no redundancia inútil.

create table if not exists public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria_id text not null,
  version_politica text not null,
  otorgado_en timestamptz not null default now(),
  unique (usuario_id, categoria_id, version_politica)
);

alter table public.consentimientos enable row level security;
