-- Deporte, ya no sensible (0018), deja de hablar de salud en su descripción:
-- "Actividad física y movimiento." Se cambian las traducciones que ve la app,
-- el texto por defecto del catálogo y la copia de cada usuario (la que va en
-- la exportación de datos). Solo si siguen con el texto antiguo: no pisa una
-- edición hecha desde el admin.
--
-- Repetible. Puede ejecutarse antes o después de desplegar.

update public.category_translations set description = 'Actividad física y movimiento.'
where locale = 'es' and description = 'Actividad física y salud.'
  and catalog_id = (select id from public.category_catalog where key = 'deporte');

update public.category_translations set description = 'Physical activity and movement.'
where locale = 'en' and description = 'Physical activity and health.'
  and catalog_id = (select id from public.category_catalog where key = 'deporte');

update public.category_catalog set description = 'Actividad física y movimiento.'
where key = 'deporte' and description = 'Actividad física y salud.';

update public.categories set description = 'Actividad física y movimiento.'
where description = 'Actividad física y salud.'
  and catalog_id = (select id from public.category_catalog where key = 'deporte');
