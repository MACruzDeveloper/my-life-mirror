-- RF-49 v1.1: un viaje pasa a ser un país de una lista cerrada y un año (con
-- el mes si se recuerda), en lugar de un título libre, un día exacto y un punto
-- del mapa. Sin texto libre y sin coordenadas: el mapa pinta el país entero.
--
-- La 0029 nunca llegó a producción con datos (la función no se había
-- desplegado), así que si la tabla tiene todavía la forma de la 0029 se
-- sustituye entera. Si ya tiene la nueva, no se toca: se puede repetir.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa, y DESPUÉS de
-- la 0029 (si la 0029 no se ejecutó, esta crea la tabla igualmente).

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'title') then
    drop table public.trips;
  end if;
end $$;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  trip_year smallint not null check (trip_year between 1900 and 2100),
  trip_month smallint check (trip_month between 1 and 12),
  created_at timestamptz not null default now()
);

create index if not exists trips_user_idx on public.trips (user_id, trip_year desc);

alter table public.trips enable row level security;
