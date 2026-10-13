-- RF-46: profesión y aficiones del perfil, opcionales. Se guardan claves de dos
-- listas cerradas de la app (accounts/domain/catalog), nunca texto escrito por
-- el usuario. Van en el perfil: se exportan y se borran con él.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

alter table public.profiles
  add column if not exists occupation text check (occupation is null or char_length(occupation) <= 100),
  add column if not exists hobbies text[] not null default '{}' check (cardinality(hobbies) <= 8);
