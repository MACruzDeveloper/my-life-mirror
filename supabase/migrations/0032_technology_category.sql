-- Tecnología, categoría nueva del catálogo (16 oct. 2026, pedida por el autor): la
-- relación con la tecnología (pantallas, desconexión, aprender herramientas). No
-- sensible. Clave estable 'tecnologia': es la que une la categoría con sus ideas,
-- sus opciones de "¿Qué te ayuda?" y sus ejemplos, que viven en el código.
--
-- Cada usuario la recibe, inactiva, la próxima vez que abre sus categorías.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que la usa. Repetible.

-- Si alguien ya la creó a mano desde administración (sin clave), se adopta esa fila.
update public.category_catalog
set key = 'tecnologia'
where key is null
  and id in (select catalog_id from public.category_translations where locale = 'es' and lower(name) = 'tecnología')
  and not exists (select 1 from public.category_catalog where key = 'tecnologia');

insert into public.category_catalog (name, description, is_sensitive_data, key)
select 'Tecnología', 'Tu relación con la tecnología: pantallas, desconexión y lo que aprendes.', false, 'tecnologia'
where not exists (select 1 from public.category_catalog where key = 'tecnologia');

insert into public.category_translations (catalog_id, locale, name, description)
select id, v.locale, v.name, v.description
from public.category_catalog
cross join (values
  ('es', 'Tecnología', 'Tu relación con la tecnología: pantallas, desconexión y lo que aprendes.'),
  ('en', 'Technology', 'Your relationship with technology: screens, switching off and what you learn.')
) as v(locale, name, description)
where key = 'tecnologia'
on conflict (catalog_id, locale) do nothing;
