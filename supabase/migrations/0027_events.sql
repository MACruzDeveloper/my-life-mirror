-- RF-48: eventos propios del calendario: un título corto, un día y, si se
-- quiere, una categoría. Privados: solo los lee el servidor con la service role
-- key (RLS sin políticas). El título es texto libre de su autor: no se envía a
-- la IA ni se comparte. Se escriben desde el calendario y se leen también en
-- Inicio (funciones distintas): van en la base de datos desde el principio
-- (ADR-04, apartado 5.1). Se borran con la cuenta; si se borra la categoría, el
-- evento se queda sin ella.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  event_day date not null,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists events_user_idx on public.events (user_id, event_day);

alter table public.events enable row level security;
