import type { Clock } from "#shared/domain/Clock.js";
import type { AiUsageLimiter } from "../domain/AiUsageLimiter.js";

/** Fake para tests — ADR-03 apartado 3.6. En producción: SupabaseAiUsageLimiter (las funciones no comparten memoria). */
export class InMemoryAiUsageLimiter implements AiUsageLimiter {
  private readonly uses = new Map<string, number>();
  private readonly limit: number;
  private readonly clock: Clock;

  constructor(limit: number, clock: Clock) {
    this.limit = limit;
    this.clock = clock;
  }

  async tryConsume(userId: string): Promise<boolean> {
    // El día, en UTC, como en la base de datos.
    const key = `${userId}:${this.clock.now().toISOString().slice(0, 10)}`;
    const used = this.uses.get(key) ?? 0;
    if (used >= this.limit) return false;
    this.uses.set(key, used + 1);
    return true;
  }
}
