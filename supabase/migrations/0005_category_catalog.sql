-- ADM-02: catálogo global de categorías, gestionado por el administrador.
-- Las categorías de cada usuario (public.categories) se siguen sembrando por
-- usuario, pero ahora a partir de esta tabla (ListCategories sincroniza al
-- listar). Retirar = rellenar retired_at; nunca se borra (RF-12).
-- Ejecutar a mano en el SQL Editor de Supabase (como 0001-0004).

create table if not exists public.category_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  is_sensitive_data boolean not null default false,
  retired_at timestamptz
);

-- Un nombre no se reutiliza ni retirado; se compara sin distinguir mayúsculas.
create unique index if not exists category_catalog_name_lower_idx
  on public.category_catalog (lower(name));

alter table public.category_catalog enable row level security;

-- Las 9 categorías estándar actuales (mismos textos que usaba el código).
insert into public.category_catalog (name, description, is_sensitive_data) values
  ('Economía', 'Tus finanzas personales: ahorro, gasto, deudas.', false),
  ('Vida social', 'Amistades y tiempo con otras personas.', false),
  ('Pareja', 'Tu relación de pareja, si la tienes.', false),
  ('Sexo', 'Tu vida sexual.', true),
  ('Deporte', 'Actividad física y salud.', true),
  ('Aventura', 'Nuevas experiencias, viajes, retos.', false),
  ('Espiritualidad', 'Creencias, religión o práctica espiritual.', true),
  ('Familia', 'Tu relación con tu familia.', false),
  ('Inversiones', 'Inversión y planificación financiera a largo plazo.', false)
on conflict do nothing;
