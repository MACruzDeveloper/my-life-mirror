-- 18 oct. 2026, pedido por el autor: reorganización de categorías, sin perder datos.
--   a) Economía pasa a llamarse Finanzas (incluye la inversión). La clave sigue siendo 'economia'.
--   b) Inversiones se retira (como "Retirar" en el panel, ADM-02): deja de ofrecerse y se desactiva
--      en todos los usuarios; sus puntuaciones se conservan (RF-12).
--   c) Idiomas (creada desde el panel, sin clave) pasa a ser Formación, con clave 'formacion': quien
--      tenga puntuaciones en Idiomas las conserva. Si no existe, se crea.
--   d) Voluntariado, categoría nueva, no sensible.
-- Las ideas, opciones y ejemplos de cada clave viven en el código.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que la usa. Repetible.

-- a) Finanzas
update public.category_catalog
set name = 'Finanzas', description = 'Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo.'
where key = 'economia';

update public.category_translations t
set name = v.name, description = v.description
from public.category_catalog c, (values
  ('es', 'Finanzas', 'Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo.'),
  ('en', 'Finances', 'Your finances: savings, spending, debts and long-term investing.')
) as v(locale, name, description)
where c.key = 'economia' and t.catalog_id = c.id and t.locale = v.locale;

update public.categories
set name = 'Finanzas', description = 'Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo.'
where catalog_id = (select id from public.category_catalog where key = 'economia');

-- b) Inversiones, retirada
update public.category_catalog set retired_at = now() where key = 'inversiones' and retired_at is null;
update public.categories set status = 'inactive'
where catalog_id = (select id from public.category_catalog where key = 'inversiones') and status <> 'inactive';

-- c) Formación: adopta Idiomas si existe; si no, la crea
update public.category_catalog
set key = 'formacion', name = 'Formación', description = 'Lo que aprendes: estudios, cursos, idiomas y habilidades nuevas.', is_sensitive_data = false
where key is null
  and id in (select catalog_id from public.category_translations where locale = 'es' and lower(name) = 'idiomas')
  and not exists (select 1 from public.category_catalog where key = 'formacion');

insert into public.category_catalog (name, description, is_sensitive_data, key)
select 'Formación', 'Lo que aprendes: estudios, cursos, idiomas y habilidades nuevas.', false, 'formacion'
where not exists (select 1 from public.category_catalog where key = 'formacion');

insert into public.category_translations (catalog_id, locale, name, description)
select id, v.locale, v.name, v.description
from public.category_catalog
cross join (values
  ('es', 'Formación', 'Lo que aprendes: estudios, cursos, idiomas y habilidades nuevas.'),
  ('en', 'Learning', 'What you learn: studies, courses, languages and new skills.')
) as v(locale, name, description)
where key = 'formacion'
on conflict (catalog_id, locale) do update set name = excluded.name, description = excluded.description;

-- La copia de quien tenía Idiomas pasa a llamarse Formación (sus puntuaciones van por id, no por nombre).
update public.categories
set name = 'Formación', description = 'Lo que aprendes: estudios, cursos, idiomas y habilidades nuevas.'
where catalog_id = (select id from public.category_catalog where key = 'formacion');

-- d) Voluntariado
insert into public.category_catalog (name, description, is_sensitive_data, key)
select 'Voluntariado', 'El tiempo que dedicas a ayudar a otras personas, a los animales o a tu entorno.', false, 'voluntariado'
where not exists (select 1 from public.category_catalog where key = 'voluntariado');

insert into public.category_translations (catalog_id, locale, name, description)
select id, v.locale, v.name, v.description
from public.category_catalog
cross join (values
  ('es', 'Voluntariado', 'El tiempo que dedicas a ayudar a otras personas, a los animales o a tu entorno.'),
  ('en', 'Volunteering', 'The time you give to help other people, animals or your surroundings.')
) as v(locale, name, description)
where key = 'voluntariado'
on conflict (catalog_id, locale) do nothing;
