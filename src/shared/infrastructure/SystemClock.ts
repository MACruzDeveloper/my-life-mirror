import type { Clock } from "@shared/domain/Clock";

/** Adaptador real de Clock — usa el reloj del sistema. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
