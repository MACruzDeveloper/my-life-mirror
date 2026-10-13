-- Salud, categoría nueva del catálogo (12 oct. 2026, segunda prueba con una usuaria).
-- Sensible (salud es categoría especial del RGPD, art. 9): pide consentimiento al
-- activarla y queda fuera de la IA y de las experiencias compartidas, como Sexo y
-- Espiritualidad. Clave estable 'salud': es la que une la categoría con sus ideas,
-- sus opciones de "¿Qué te ayuda?" y sus ejemplos, que viven en el código.
--
-- Cada usuario la recibe, inactiva, la próxima vez que abre sus categorías.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que la usa. Repetible.

-- Si alguien ya la creó a mano desde administración (sin clave), se adopta esa fila.
update public.category_catalog
set key = 'salud', is_sensitive_data = true
where key is null
  and id in (select catalog_id from public.category_translations where locale = 'es' and lower(name) = 'salud')
  and not exists (select 1 from public.category_catalog where key = 'salud');

insert into public.category_catalog (name, description, is_sensitive_data, key)
select 'Salud', 'Cómo te encuentras: descanso, energía y cuidado de ti.', true, 'salud'
where not exists (select 1 from public.category_catalog where key = 'salud');

insert into public.category_translations (catalog_id, locale, name, description)
select id, v.locale, v.name, v.description
from public.category_catalog
cross join (values
  ('es', 'Salud', 'Cómo te encuentras: descanso, energía y cuidado de ti.'),
  ('en', 'Health', 'How you feel: rest, energy and looking after yourself.')
) as v(locale, name, description)
where key = 'salud'
on conflict (catalog_id, locale) do nothing;

-- La copia de quien ya la tuviera (creada a mano) pasa a ser sensible también.
update public.categories set is_sensitive_data = true
where catalog_id = (select id from public.category_catalog where key = 'salud') and is_sensitive_data = false;
