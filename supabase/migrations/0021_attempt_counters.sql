-- SEC-02: tope de intentos en los controladores públicos (inicio de sesión,
-- registro, recuperar y cambiar la contraseña), para que nadie pueda probar
-- contraseñas, crear cuentas o pedir correos sin freno.
-- Se guarda aquí y no en memoria porque cada función serverless está aislada.
-- `key` es un resumen (SHA-256) de "acción + IP" o "acción + email": aquí no
-- queda ningún email ni ninguna IP. Ventanas fijas (p. ej. de 15 minutos).
-- Lo usa el servidor con la service role key (RLS sin políticas).
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.
-- Si faltara, el servidor deja pasar las peticiones y lo anota en el log.

create table if not exists public.attempt_counters (
  key text not null,
  window_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (key, window_start)
);

alter table public.attempt_counters enable row level security;

-- Cuenta un intento si quedan en esa ventana: comprobar y sumar en una sola
-- sentencia, para que dos peticiones a la vez no pasen las dos el tope.
-- Devuelve si se pudo contar. De paso borra las ventanas de hace más de un día.
create or replace function public.consume_attempt(p_key text, p_window_start timestamptz, p_max integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  counted integer;
begin
  if p_max <= 0 then
    return false;
  end if;

  delete from public.attempt_counters where window_start < now() - interval '1 day';

  insert into public.attempt_counters as counter (key, window_start, attempts)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update
    set attempts = counter.attempts + 1
    where counter.attempts < p_max
  returning counter.attempts into counted;

  return counted is not null;
end;
$$;

-- Solo el servidor (service role) puede llamarla.
revoke all on function public.consume_attempt(text, timestamptz, integer) from public, anon, authenticated;
