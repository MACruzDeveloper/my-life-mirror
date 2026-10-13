-- RF-19: lo que cada persona decide sobre una idea del carrusel: guardarla
-- ('saved'), darla por hecha ('done') o descartarla ('discarded'). Una reacción
-- por usuario, categoría e idea. Se guarda la CLAVE de la idea del catálogo
-- (p. ej. 'economia.2'), nunca su texto. Se escribe desde la ventana de ideas y
-- se lee en Inicio: funciones distintas, así que va en la base de datos desde el
-- principio (ADR-04, apartado 5.1). Lo usa el servidor con la service role key
-- (RLS sin políticas). Se borra con la cuenta y con la categoría.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

create table if not exists public.idea_reactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  template_key text not null check (char_length(template_key) between 1 and 60),
  reaction text not null check (reaction in ('saved', 'done', 'discarded')),
  reacted_at timestamptz not null default now(),
  primary key (user_id, category_id, template_key)
);

alter table public.idea_reactions enable row level security;
