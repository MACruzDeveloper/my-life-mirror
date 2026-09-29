-- RF-41: opciones de "¿Qué te ayuda en esta área?" que marca cada usuario en
-- su copia de cada categoría (claves de src/modules/categories/domain/experienceOptions.ts,
-- p. ej. 'deporte.caminar'). Lista cerrada: es lo único que podrá usar la IA de
-- RF-40, y solo si el usuario lo activa.
--
-- Se borra con la categoría (y esta con el usuario, RF-05): no hace falta nada más.
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa (el repositorio
-- lee y escribe la columna). Repetible.

alter table public.categories
  add column if not exists experience_tags text[] not null default '{}';
