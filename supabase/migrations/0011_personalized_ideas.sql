-- RF-40: ideas personalizadas con IA.
--   - profiles.ai_ideas_enabled / ai_ideas_enabled_at: el usuario lo activa él mismo
--     (desactivado por defecto) y se guarda cuándo, como constancia del consentimiento.
--   - personalized_ideas: la versión personalizada de una recomendación, por idioma.
--     Se escribe una vez y se reutiliza. Se borra con su recomendación y con el usuario
--     (RF-05); la app además la borra explícitamente, y al desactivar la función.
--     Sin políticas RLS: solo la lee el servidor con la service role key.
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

alter table public.profiles
  add column if not exists ai_ideas_enabled boolean not null default false,
  add column if not exists ai_ideas_enabled_at timestamptz;

create table if not exists public.personalized_ideas (
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  template_key text not null,
  text text not null check (char_length(text) between 1 and 600),
  model text not null,
  created_at timestamptz not null default now(),
  primary key (recommendation_id, locale)
);

create index if not exists personalized_ideas_user_idx on public.personalized_ideas (user_id);

alter table public.personalized_ideas enable row level security;
