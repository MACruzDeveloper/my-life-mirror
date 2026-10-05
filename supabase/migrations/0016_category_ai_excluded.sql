-- RF-45 v1.4: categorías del catálogo que nunca van a la IA (ni RF-40 ni RF-45)
-- sin ser sensibles: no piden consentimiento al activarlas (no son datos de
-- categoría especial del RGPD), solo se quedan fuera de la IA. Las sensibles
-- quedan fuera siempre, tengan o no esta marca. De momento, Pareja; más
-- adelante, editable desde el admin (ADM-04).
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

alter table public.category_catalog
  add column if not exists ai_excluded boolean not null default false;

update public.category_catalog set ai_excluded = true where key = 'pareja';
