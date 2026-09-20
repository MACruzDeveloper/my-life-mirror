-- RF-18: recomendaciones propuestas a un usuario cuando una categoría puntúa
-- bajo (RD-04). Persistencia real desde el principio (se escribe al guardar la
-- entrevista y se lee al ver resultados: funciones distintas, ver
-- 04_Almacenamiento_Datos.md §7bis). Guarda la CLAVE de la plantilla, no el
-- texto (la interfaz lo traduce). Cubierta por el derecho al olvido (RF-05):
-- se borra con la cuenta (on delete cascade) y también explícitamente.
-- Ejecutar a mano en el SQL Editor de Supabase (como 0001-0006).

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  template_key text not null,
  threshold smallint not null check (threshold between 2 and 10),
  status text not null default 'pending' check (status in ('pending', 'done', 'discarded', 'postponed')),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_user_idx on public.recommendations (user_id, created_at desc);

alter table public.recommendations enable row level security;
