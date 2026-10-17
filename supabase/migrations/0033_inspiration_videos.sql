-- ADM-04 (primera parte): los vídeos de inspiración de las páginas de categoría
-- (RF-49) pasan del código a la base de datos, para añadirlos y quitarlos desde
-- el panel de administración, por categoría e idioma. Contenido curado: solo los
-- escribe administración, desde el servidor (RLS sin políticas). Se guarda solo
-- el identificador de YouTube, validado con su formato.
--
-- Trae los seis de ejemplo que había en el código, en inglés.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

create table if not exists public.inspiration_videos (
  id uuid primary key default gen_random_uuid(),
  category_key text not null check (char_length(category_key) between 1 and 40),
  locale text not null check (locale in ('es', 'en')),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (category_key, locale, youtube_id)
);

create index if not exists inspiration_videos_page_idx on public.inspiration_videos (category_key, locale);

alter table public.inspiration_videos enable row level security;

-- Si se ejecutó una versión anterior de esta migración (con quién habla), esa columna sobra.
alter table public.inspiration_videos drop column if exists speaker;

-- Los de ejemplo, con segundos distintos para conservar su orden.
insert into public.inspiration_videos (category_key, locale, youtube_id, title, created_at)
values
  ('aventura', 'en', 'agTZLKFUKEY', 'To the South Pole and back: the hardest 105 days of my life', '2026-10-16 10:00:00+00'),
  ('aventura', 'en', 'UNP03fDSj1U', 'Try something new for 30 days', '2026-10-16 10:00:01+00'),
  ('aventura', 'en', '-vZXgApsPCQ', 'What I learned from 100 days of rejection', '2026-10-16 10:00:02+00'),
  ('deporte', 'en', 'BHY0FxzoKZE', 'The brain-changing benefits of exercise', '2026-10-16 10:00:03+00'),
  ('deporte', 'en', 'b-iGZPtWXzE', 'Are we born to run?', '2026-10-16 10:00:04+00'),
  ('deporte', 'en', '58_3Ox493fA', 'Why some people find exercise harder than others', '2026-10-16 10:00:05+00')
on conflict (category_key, locale, youtube_id) do nothing;
