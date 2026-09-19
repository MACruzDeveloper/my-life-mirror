-- RF-03: perfil de usuario. Reemplaza a InMemoryProfileRepository, que no
-- puede compartirse entre api/register.ts, api/profile.ts y api/sesion.ts
-- (cada uno es una función serverless separada, sin memoria compartida).
--
-- Solo el service role key (usado en api/, nunca en el navegador) toca esta
-- tabla — RLS está activado a propósito sin ninguna policy, para que el
-- API REST autogenerado de Supabase la deje inaccesible con la clave anon.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  gender text check (gender in ('woman', 'man', 'non-binary', 'prefer-not-to-say')),
  time_zone text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
