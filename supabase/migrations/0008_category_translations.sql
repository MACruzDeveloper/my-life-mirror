-- RNF-10: nombre y descripción en inglés de las categorías que crea el admin
-- (ADM-02). Las 9 estándar no los necesitan: se traducen en la interfaz.
-- Nullable a propósito: las filas existentes (estándar) no tienen traducción
-- en la base de datos. Ejecutar a mano en el SQL Editor de Supabase (como 0001-0007).

alter table public.category_catalog
  add column if not exists name_en text check (name_en is null or char_length(name_en) <= 60),
  add column if not exists description_en text check (description_en is null or char_length(description_en) <= 200);

-- El nombre en inglés tampoco se repite (sin distinguir mayúsculas), igual que el español.
create unique index if not exists category_catalog_name_en_lower_idx
  on public.category_catalog (lower(name_en)) where name_en is not null;

-- La copia de cada usuario (se rellena al sincronizar con el catálogo, ver ListCategories).
alter table public.categories
  add column if not exists name_en text,
  add column if not exists description_en text;

-- Por si el admin ya creó alguna categoría antes de esta migración: copia a los
-- usuarios la traducción que tenga el catálogo (hoy ninguna; no hace daño).
update public.categories as c
set name_en = cc.name_en, description_en = cc.description_en
from public.category_catalog as cc
where cc.name = c.name and cc.name_en is not null and c.name_en is null;
