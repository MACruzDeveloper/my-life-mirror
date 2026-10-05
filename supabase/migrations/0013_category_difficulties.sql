-- RF-42: situaciones que le ponen difícil una categoría a cada usuario, en su copia
-- de la categoría (claves de src/modules/recommendations/domain/ideaSituations.ts,
-- p. ej. 'salirDeCasa'). Lista cerrada: las ideas que chocan no se le proponen.
-- Nunca se envían a la IA.
--
-- Se borra con la categoría (y esta con el usuario, RF-05): no hace falta nada más.
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa (el repositorio
-- lee y escribe la columna). Repetible.

alter table public.categories
  add column if not exists difficulty_tags text[] not null default '{}';
