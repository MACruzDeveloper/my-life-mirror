-- RF-47: un día orientativo para probar una idea guardada. Opcional; es una
-- propuesta de la propia persona, no un plazo. Solo tiene sentido en las
-- guardadas ('saved'): al marcarla hecha o descartarla, queda a null.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa, y DESPUÉS de
-- la 0024. Repetible.

alter table public.idea_reactions
  add column if not exists planned_for date check (planned_for is null or reaction = 'saved');
