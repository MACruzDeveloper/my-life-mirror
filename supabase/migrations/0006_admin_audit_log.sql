-- ADM-03: registro de auditoría de las acciones de administración.
-- Solo ids, la acción y un detalle corto no sensible: sin emails, contraseñas
-- ni contenido de usuarios (derecho al olvido, RF-05). actor_id/target_id NO
-- tienen clave foránea a auth.users a propósito: eliminar una cuenta no debe
-- borrar la huella de lo que se hizo con ella.
-- Solo se inserta y se lee: el trigger impide editar o borrar filas (OWASP A09,
-- registros a prueba de manipulación accidental; la service role podría
-- desactivarlo a propósito, lo que ya sería un acto deliberado y visible).
-- Ejecutar a mano en el SQL Editor de Supabase (como 0001-0005).

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  target_id uuid,
  detail text check (detail is null or char_length(detail) <= 200),
  occurred_at timestamptz not null default now()
);

create index if not exists admin_audit_log_occurred_idx on public.admin_audit_log (occurred_at desc);

alter table public.admin_audit_log enable row level security;

create or replace function public.admin_audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'admin_audit_log es de solo inserción';
end;
$$;

drop trigger if exists admin_audit_log_no_update_delete on public.admin_audit_log;
create trigger admin_audit_log_no_update_delete
  before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_immutable();
