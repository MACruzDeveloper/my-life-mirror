import type { AttemptLimit, AttemptLimiter } from "#shared/domain/AttemptLimiter.js";
import type { Clock } from "#shared/domain/Clock.js";

/** Principio de la ventana fija a la que pertenece `now` (las 10:07 con ventanas de 15 min → las 10:00). */
export function windowStart(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/** Fake para tests — ADR-03 apartado 3.6. En producción: SupabaseAttemptLimiter (las funciones no comparten memoria). */
export class InMemoryAttemptLimiter implements AttemptLimiter {
  private readonly attempts = new Map<string, number>();
  private readonly clock: Clock;

  constructor(clock: Clock) {
    this.clock = clock;
  }

  async tryConsume(key: string, limit: AttemptLimit): Promise<boolean> {
    const windowKey = `${key}@${windowStart(this.clock.now(), limit.windowSeconds).toISOString()}`;
    const used = this.attempts.get(windowKey) ?? 0;
    if (used >= limit.max) return false;
    this.attempts.set(windowKey, used + 1);
    return true;
  }
}

/** Sin tope: solo para el Supabase local de los E2E y de `dev:local`, donde una misma máquina registra decenas de cuentas. */
export class UnlimitedAttemptLimiter implements AttemptLimiter {
  async tryConsume(): Promise<boolean> {
    return true;
  }
}
