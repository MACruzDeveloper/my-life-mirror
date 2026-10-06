-- RF-44: diario de experiencias por categoría, separado de las evaluaciones
-- (que son inmutables, RF-12): así se pueden añadir sin puntuar y borrar.
-- Privadas: solo las lee el servidor con la service role key (RLS sin políticas).
-- Se borran con la categoría y con el usuario (RF-05); la app además las borra
-- explícitamente al eliminar la cuenta.
--
-- Las notas que ya existían en las evaluaciones (RF-11) se copian aquí con la
-- fecha de su evaluación. La nota original se conserva en la evaluación, pero la
-- interfaz ya solo enseña las experiencias. `source_assessment_id` evita copiar
-- dos veces si la migración se ejecuta de nuevo.
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now(),
  source_assessment_id uuid unique references public.assessments(id) on delete set null
);

create index if not exists experiences_user_idx on public.experiences (user_id, created_at desc);

alter table public.experiences enable row level security;

insert into public.experiences (user_id, category_id, text, created_at, source_assessment_id)
select a.user_id, a.category_id, btrim(a.note), a.recorded_at, a.id
from public.assessments a
where a.note is not null and btrim(a.note) <> ''
on conflict (source_assessment_id) do nothing;
