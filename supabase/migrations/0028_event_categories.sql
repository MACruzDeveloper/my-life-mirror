-- RF-48 v1.2: un evento puede tener que ver con varias categorías ("Boda de mi
-- prima": vida social y familia). `category_id` (una sola) pasa a ser
-- `category_ids` (hasta cinco). Lo que hubiera en `category_id` se conserva.
-- Un array no admite clave ajena: si una categoría se borra, su id se queda en
-- el evento y la app lo ignora al leer (solo usa las categorías que existen).
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa, y DESPUÉS de
-- la 0027. Repetible.

alter table public.events
  add column if not exists category_ids uuid[] not null default '{}' check (cardinality(category_ids) <= 5);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'category_id') then
    update public.events set category_ids = array[category_id] where category_id is not null and category_ids = '{}';
    alter table public.events drop column category_id;
  end if;
end $$;
