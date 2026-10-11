import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "#shared/infrastructure/supabaseServiceClient.js";
import type { AttemptLimit, AttemptLimiter } from "#shared/domain/AttemptLimiter.js";
import type { Clock } from "#shared/domain/Clock.js";
import { windowStart } from "./InMemoryAttemptLimiter.js";

/**
 * Adaptador real (migración 0021): cuenta en la base de datos con una función
 * que comprueba y suma en una sola sentencia (dos peticiones a la vez no pasan
 * las dos el tope). Sin test propio: solo llama a la función, como el resto de
 * adaptadores Supabase.
 */
export class SupabaseAttemptLimiter implements AttemptLimiter {
  private readonly client: SupabaseClient;
  private readonly clock: Clock;

  constructor(url: string, serviceRoleKey: string, clock: Clock) {
    this.client = createServiceClient(url, serviceRoleKey);
    this.clock = clock;
  }

  async tryConsume(key: string, limit: AttemptLimit): Promise<boolean> {
    const { data, error } = await this.client.rpc("consume_attempt", {
      p_key: key,
      p_window_start: windowStart(this.clock.now(), limit.windowSeconds).toISOString(),
      p_max: limit.max,
    });
    if (error) throw new Error(`No se pudo contar el intento: ${error.message}`);
    return data === true;
  }
}
