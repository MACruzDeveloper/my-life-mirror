-- Historial simulado de entrevistas para UN usuario (desarrollo y demo).
--
-- Para qué: ver los gráficos de evolución (RF-16) y el radar (RF-15) con datos de
-- varios meses sin esperar meses. NO es una migración: no va en supabase/migrations
-- ni se ejecuta solo. Se pega en el SQL Editor de Supabase (real o local, Studio en
-- http://127.0.0.1:54323) cambiando el email de abajo.
--
-- Qué hace:
--   - Una "entrevista" al mes durante los últimos `meses` meses (día y hora al azar),
--     siempre ANTERIOR a la primera respuesta real del usuario: no toca ni desplaza lo
--     que ya ha contestado, y su puntuación actual sigue siendo la real.
--   - Solo en sus categorías ACTIVAS (así nunca escribe en una sensible sin consentimiento).
--   - En cada entrevista contesta cada categoría con un 75 % de probabilidad (como una
--     persona real, que no siempre actualiza todo), y al menos una.
--   - Cada categoría sigue un paseo aleatorio suave (±2 como mucho de un mes al otro)
--     que termina cerca de su puntuación real actual, para que la línea empalme.
--   - Todas las respuestas de una misma entrevista comparten `recorded_at` exacto: así
--     el historial las agrupa como un único guardado.
--   - Marca: las filas simuladas llevan los microsegundos de `recorded_at` a 424242.
--     Es invisible en la app y permite borrarlas todas (bloque del final).
--
-- Repetible: antes de insertar borra el historial simulado anterior de ese usuario.

do $$
declare
  v_email   text := 'tu-email@ejemplo.com';  -- ← CAMBIAR
  v_meses   int  := 12;                      -- meses hacia atrás

  v_user    uuid;
  v_cutoff  timestamptz;
  v_cat     record;
  v_session timestamptz;
  v_sessions timestamptz[] := '{}';
  v_answered boolean;
  v_score   int;
  v_target  int;
  v_i       int;
  v_scores  jsonb := '{}';   -- última puntuación simulada por categoría (paseo aleatorio)
begin
  select id into v_user from auth.users where email = lower(v_email);
  if v_user is null then
    raise exception 'No existe ningún usuario con el email %', v_email;
  end if;

  if not exists (select 1 from public.categories where user_id = v_user and status = 'active') then
    raise exception 'El usuario no tiene categorías activas: actívalas primero en la entrevista.';
  end if;

  -- Repetible: fuera lo simulado antes.
  delete from public.assessments
  where user_id = v_user and to_char(recorded_at, 'US') = '424242';

  -- Todo lo simulado va antes de la primera respuesta real (o de ahora, si no hay).
  select coalesce(min(recorded_at), now()) into v_cutoff
  from public.assessments where user_id = v_user;

  -- Fechas de las entrevistas: una por mes, de la más antigua a la más reciente.
  for v_i in reverse v_meses..1 loop
    v_session := date_trunc('month', v_cutoff - make_interval(months => v_i))
                 + make_interval(days => floor(random() * 27)::int,
                                 hours => 8 + floor(random() * 13)::int,
                                 mins => floor(random() * 60)::int)
                 + interval '0.424242 seconds';
    if v_session < v_cutoff then
      v_sessions := v_sessions || v_session;
    end if;
  end loop;

  -- Punto de partida de cada categoría: su puntuación real ± algo, o un valor medio.
  for v_cat in
    select c.id,
           (select a.score from public.assessments a
            where a.category_id = c.id order by a.recorded_at desc limit 1) as current_score
    from public.categories c
    where c.user_id = v_user and c.status = 'active'
  loop
    v_target := coalesce(v_cat.current_score, 5 + floor(random() * 3)::int);
    v_score  := greatest(1, least(10, v_target + (floor(random() * 7)::int - 3)));
    v_scores := v_scores || jsonb_build_object(v_cat.id::text, jsonb_build_object('score', v_score, 'target', v_target));
  end loop;

  for v_i in 1..coalesce(array_length(v_sessions, 1), 0) loop
    v_answered := false;
    for v_cat in
      select id from public.categories where user_id = v_user and status = 'active' order by random()
    loop
      -- 75 % de probabilidad de contestar cada categoría; la última garantiza al menos una.
      continue when v_answered and random() > 0.75;
      v_score  := (v_scores -> v_cat.id::text ->> 'score')::int;
      v_target := (v_scores -> v_cat.id::text ->> 'target')::int;
      -- Paseo aleatorio con tendencia hacia la puntuación real: ±2 como mucho.
      v_score := greatest(1, least(10,
                 v_score + sign(v_target - v_score)::int * (random() < 0.5)::int
                         + (floor(random() * 3)::int - 1)));
      v_scores := jsonb_set(v_scores, array[v_cat.id::text, 'score'], to_jsonb(v_score));
      insert into public.assessments (user_id, category_id, score, recorded_at)
      values (v_user, v_cat.id, v_score, v_sessions[v_i]);
      v_answered := true;
    end loop;
  end loop;

  raise notice 'Historial simulado: % entrevistas para %', coalesce(array_length(v_sessions, 1), 0), v_email;
end $$;

-- Comprobación: entrevistas simuladas por mes.
-- select date_trunc('month', recorded_at) as mes, count(distinct recorded_at) as entrevistas, count(*) as respuestas
-- from public.assessments
-- where user_id = (select id from auth.users where email = 'tu-email@ejemplo.com')
--   and to_char(recorded_at, 'US') = '424242'
-- group by 1 order by 1;

-- Borrar TODO lo simulado de ese usuario (deja intactas sus respuestas reales):
-- delete from public.assessments
-- where user_id = (select id from auth.users where email = 'tu-email@ejemplo.com')
--   and to_char(recorded_at, 'US') = '424242';
