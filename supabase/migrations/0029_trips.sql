-- RF-49: los viajes de la página de Aventura. Son recuerdos (o planes), no
-- evaluaciones: no cambian ninguna puntuación. Privados: solo los lee el
-- servidor con la service role key (RLS sin políticas). El título es texto
-- libre de su autor: no se envía a la IA ni se comparte. Del lugar solo se
-- guarda un punto redondeado a dos decimales (alrededor de un kilómetro).
-- Se escriben y se leen desde funciones de `api/` distintas en el futuro:
-- van en la base de datos desde el principio (ADR-04, apartado 5.1). Se borran
-- con la cuenta.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  trip_day date not null check (trip_day >= date '1900-01-01'),
  lat numeric(5, 2) not null check (lat between -90 and 90),
  lng numeric(5, 2) not null check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

create index if not exists trips_user_idx on public.trips (user_id, trip_day desc);

alter table public.trips enable row level security;
