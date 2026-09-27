-- RNF-10 / ADM-02: traducciones de las categorías en su propia tabla (una fila
-- por categoría e idioma) en lugar de una columna por idioma. Sustituye a las
-- columnas name_en/description_en de la migración 0008, que se eliminan al
-- final después de copiar su contenido. Añadir un idioma ya no cambia el esquema.
--
-- Además, identidades estables en vez de nombres:
--   - category_catalog.key: clave de las 9 categorías estándar ('economia'...),
--     que usan los ejemplos de la entrevista y las plantillas de recomendación.
--   - categories.catalog_id: cada copia de usuario apunta a su entrada del
--     catálogo por id (antes se enlazaban por el nombre en español).
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa (lee
-- category_translations y categories.catalog_id). Ejecutar a mano en el SQL
-- Editor de Supabase, como las anteriores. Es repetible (if not exists / on conflict).

-- 1. Clave estable de las categorías estándar.
alter table public.category_catalog add column if not exists key text;
create unique index if not exists category_catalog_key_idx on public.category_catalog (key) where key is not null;

update public.category_catalog as cc
set key = v.key
from (values
  ('Economía', 'economia'),
  ('Vida social', 'vidaSocial'),
  ('Pareja', 'pareja'),
  ('Sexo', 'sexo'),
  ('Deporte', 'deporte'),
  ('Aventura', 'aventura'),
  ('Espiritualidad', 'espiritualidad'),
  ('Familia', 'familia'),
  ('Inversiones', 'inversiones')
) as v(name, key)
where cc.name = v.name and cc.key is null;

-- 2. Tabla de traducciones.
create table if not exists public.category_translations (
  catalog_id uuid not null references public.category_catalog(id) on delete cascade,
  locale text not null check (char_length(locale) between 2 and 10),
  name text not null check (char_length(name) between 1 and 60),
  description text not null check (char_length(description) between 1 and 200),
  primary key (catalog_id, locale)
);

-- Un nombre no se repite dentro de un idioma (sin distinguir mayúsculas). La
-- regla completa (tampoco entre idiomas) la aplica el caso de uso AddCatalogCategory.
create unique index if not exists category_translations_locale_name_idx
  on public.category_translations (locale, lower(name));

alter table public.category_translations enable row level security;

-- 3. Rellenar: español desde el propio catálogo...
insert into public.category_translations (catalog_id, locale, name, description)
select id, 'es', name, description from public.category_catalog
on conflict (catalog_id, locale) do nothing;

-- ...inglés de las categorías que el admin creó con la migración 0008...
-- (solo si las columnas de 0008 siguen ahí: al repetir la migración ya se borraron en el paso 5)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'category_catalog' and column_name = 'name_en'
  ) then
    execute 'insert into public.category_translations (catalog_id, locale, name, description)
             select id, ''en'', name_en, description_en from public.category_catalog
             where name_en is not null and description_en is not null
             on conflict (catalog_id, locale) do nothing';
  end if;
end $$;

-- ...e inglés de las 9 estándar (antes vivía en los archivos de textos de la interfaz).
insert into public.category_translations (catalog_id, locale, name, description)
select cc.id, 'en', v.name, v.description
from public.category_catalog as cc
join (values
  ('economia', 'Finances', 'Your personal finances: savings, spending, debts.'),
  ('vidaSocial', 'Social life', 'Friendships and time with other people.'),
  ('pareja', 'Relationship', 'Your relationship with your partner, if you have one.'),
  ('sexo', 'Sex', 'Your sex life.'),
  ('deporte', 'Sport', 'Physical activity and health.'),
  ('aventura', 'Adventure', 'New experiences, travel, challenges.'),
  ('espiritualidad', 'Spirituality', 'Beliefs, religion or spiritual practice.'),
  ('familia', 'Family', 'Your relationship with your family.'),
  ('inversiones', 'Investments', 'Investing and long-term financial planning.')
) as v(key, name, description) on v.key = cc.key
on conflict (catalog_id, locale) do nothing;

-- 4. Cada categoría de usuario apunta a su entrada del catálogo por id.
alter table public.categories add column if not exists catalog_id uuid references public.category_catalog(id);

update public.categories as c
set catalog_id = cc.id
from public.category_catalog as cc
where c.catalog_id is null and cc.name = c.name;

create unique index if not exists categories_user_catalog_idx
  on public.categories (user_id, catalog_id) where catalog_id is not null;

-- 5. Fuera las columnas por idioma de la migración 0008 (su contenido ya está en category_translations).
drop index if exists public.category_catalog_name_en_lower_idx;
alter table public.category_catalog drop column if exists name_en, drop column if exists description_en;
alter table public.categories drop column if exists name_en, drop column if exists description_en;
