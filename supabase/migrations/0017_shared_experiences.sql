-- RF-43: experiencias del diario compartidas de forma anónima. Las lee el
-- servidor con la service role key (RLS sin políticas, como el resto de la
-- tabla): a quien lee solo le llega el texto, nunca el usuario ni la fecha.
-- - shared_at: compartida desde entonces; null = privada.
-- - shared_locale: solo la leen quienes usan la app en ese idioma.
-- - shared_category_key: la clave del catálogo (`economia`), para buscar sin
--   cruzar tablas (las categorías son una copia por usuario).
-- - reported_at: reportada por otra persona; deja de verse y no se puede
--   volver a compartir.
-- Borrar la experiencia, la categoría o el usuario borra lo compartido.
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

alter table public.experiences
  add column if not exists shared_at timestamptz,
  add column if not exists shared_locale text check (shared_locale in ('es', 'en')),
  add column if not exists shared_category_key text,
  add column if not exists reported_at timestamptz;

create index if not exists experiences_shared_idx
  on public.experiences (shared_category_key, shared_locale, shared_at desc)
  where shared_at is not null and reported_at is null;
