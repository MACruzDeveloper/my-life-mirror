-- RF-49: los hitos de las páginas de categoría (retos superados en Aventura;
-- carreras, competiciones y marcas en Deporte). Son recuerdos, no
-- evaluaciones: no cambian ninguna puntuación. Privados: solo los lee el
-- servidor con la service role key (RLS sin políticas). El título es texto
-- libre de su autor, como el de los eventos (0027): no se envía a la IA ni se
-- comparte. Se borran con la cuenta.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_key text not null check (category_key in ('aventura', 'deporte')),
  title text not null check (char_length(title) between 1 and 80),
  milestone_year smallint not null check (milestone_year between 1900 and 2100),
  milestone_month smallint check (milestone_month between 1 and 12),
  created_at timestamptz not null default now()
);

create index if not exists milestones_user_idx on public.milestones (user_id, category_key);

alter table public.milestones enable row level security;
