-- RF-06/RF-07: catálogo de categorías y activación por usuario. Persistencia
-- real desde el principio (no en memoria) — este dato se escribe desde un
-- endpoint (activar/desactivar) y se lee desde otro (listar); ver la lección
-- de RF-03 en 04_Almacenamiento_Datos.md §5.1.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  type text not null check (type in ('standard', 'custom')),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  is_sensitive_data boolean not null default false,
  unique (user_id, name)
);

alter table public.categories enable row level security;
