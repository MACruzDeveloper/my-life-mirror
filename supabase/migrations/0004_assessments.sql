-- RF-10: evaluaciones (check-in). Registro inmutable (RF-12): solo se
-- inserta; no hay política ni código de update/delete de filas sueltas.
-- Persistencia real desde el principio: se escribe desde un endpoint y lo
-- leerán otros (panel RF-14, recomendaciones RF-18) — ver
-- 04_Almacenamiento_Datos.md §7bis. Si se borra la categoría o el usuario,
-- se borran sus evaluaciones (derecho al olvido, RF-05).

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  note text check (note is null or char_length(note) <= 500),
  recorded_at timestamptz not null default now()
);

create index if not exists assessments_user_recorded_idx
  on public.assessments (user_id, recorded_at desc);

alter table public.assessments enable row level security;
