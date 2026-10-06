-- Deporte deja de ser categoría sensible (decisión del autor, 6 oct. 2026): habla
-- de actividad física, no pide datos de salud, y cualquier área puede tocar algo
-- personal. Siguen siendo sensibles Sexo y Espiritualidad (RGPD art. 9).
-- Consecuencias: activarla ya no pide consentimiento; entra en la IA (RF-40,
-- RF-45) y se pueden compartir sus experiencias (RF-43), como el resto.
-- Los consentimientos ya dados se conservan como historial (no se borran).
-- Se cambian el catálogo y la copia de cada usuario (`categories`).
--
-- IMPORTANTE: ejecutar ANTES de desplegar el código que la usa. Repetible.

update public.category_catalog set is_sensitive_data = false where key = 'deporte';

update public.categories set is_sensitive_data = false
where catalog_id = (select id from public.category_catalog where key = 'deporte');
