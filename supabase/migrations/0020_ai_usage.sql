-- RF-40b: tope diario de usos de IA por usuario, para que nadie gaste el crédito
-- del proveedor a base de clics. Un uso = una idea personalizada o una sugerencia
-- que llega a pedirse al proveedor real (con el proveedor simulado no se cuenta).
-- Se guarda aquí y no en memoria porque cada función serverless está aislada.
-- Solo el contador por día (UTC): ni qué se pidió ni qué se respondió.
-- Lo usa el servidor con la service role key (RLS sin políticas). Se borra con
-- el usuario.
--
-- IMPORTANTE: ejecutar ANTES de activar AI_IDEAS_PROVIDER=anthropic. Repetible.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  uses integer not null default 0 check (uses >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Cuenta un uso si quedan: comprobar y sumar en una sola sentencia, para que dos
-- peticiones a la vez no pasen las dos el tope. Devuelve si se pudo contar.
create or replace function public.consume_ai_usage(p_user_id uuid, p_day date, p_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  counted integer;
begin
  if p_limit <= 0 then
    return false;
  end if;

  insert into public.ai_usage as usage (user_id, day, uses)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day) do update
    set uses = usage.uses + 1
    where usage.uses < p_limit
  returning usage.uses into counted;

  return counted is not null;
end;
$$;

-- Solo el servidor (service role) puede llamarla.
revoke all on function public.consume_ai_usage(uuid, date, integer) from public, anon, authenticated;
