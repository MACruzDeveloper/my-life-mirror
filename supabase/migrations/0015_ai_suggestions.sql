-- RF-45: el usuario activa él mismo (desactivado por defecto) que la IA le proponga
-- opciones de las listas cerradas a partir de una experiencia, y se guarda cuándo,
-- como constancia del consentimiento. Aparte del de RF-40 (ai_ideas_enabled).
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

alter table public.profiles
  add column if not exists ai_suggestions_enabled boolean not null default false,
  add column if not exists ai_suggestions_enabled_at timestamptz;
