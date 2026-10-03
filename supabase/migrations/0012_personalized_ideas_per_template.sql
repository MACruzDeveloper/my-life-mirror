-- RF-40 v1.1 (UX-05, carrusel de ideas): una idea personalizada por cada idea del
-- catálogo que el usuario ve, no una por recomendación.
--   - La clave pasa de (recommendation_id, locale) a (recommendation_id, template_key, locale).
--   - experience_tags: las opciones de "¿Qué te ayuda?" (RF-41) con las que se escribió;
--     si la categoría tiene otras, la app la reescribe. Las existentes quedan con '{}'.
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

alter table public.personalized_ideas
  add column if not exists experience_tags text[] not null default '{}';

alter table public.personalized_ideas drop constraint if exists personalized_ideas_pkey;
alter table public.personalized_ideas add primary key (recommendation_id, template_key, locale);
