import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Clock } from "#shared/domain/Clock.js";
import type { AiUsageLimiter } from "../domain/AiUsageLimiter.js";

/**
 * Adaptador real (migración 0020): cuenta en la base de datos con una función
 * que comprueba y suma en una sola sentencia (dos peticiones a la vez no pasan
 * las dos el tope). Sin test propio: solo llama a la función, como el resto de
 * adaptadores Supabase.
 */
export class SupabaseAiUsageLimiter implements AiUsageLimiter {
  private readonly client: SupabaseClient;
  private readonly limit: number;
  private readonly clock: Clock;

  constructor(url: string, serviceRoleKey: string, limit: number, clock: Clock) {
    this.client = createClient(url, serviceRoleKey);
    this.limit = limit;
    this.clock = clock;
  }

  async tryConsume(userId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("consume_ai_usage", { p_user_id: userId, p_day: this.clock.now().toISOString().slice(0, 10), p_limit: this.limit });
    if (error) throw new Error(`No se pudo contar el uso de IA: ${error.message}`);
    return data === true;
  }
}
