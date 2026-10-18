import { isCountryCode } from "./countries.js";

/**
 * RF-49: un viaje de la página de Aventura. Es un recuerdo (o un plan), no una
 * evaluación: no cambia ninguna puntuación (RN-04), no se envía a la IA y no se
 * comparte. Sin texto libre: un país de la lista cerrada y un año, con el mes
 * si se recuerda (de un viaje antiguo basta con el año).
 */
export interface Trip {
  readonly id: string;
  readonly userId: string;
  /** ISO 3166-1 de dos letras, de `countries.ts`. */
  readonly countryCode: string;
  readonly year: number;
  /** De 1 (enero) a 12; sin valor si no se recuerda. */
  readonly month?: number;
  readonly createdAt: Date;
}

/** De sobra para una vida de viajes, y la lista que se devuelve tiene límite. */
export const MAX_TRIPS_PER_USER = 300;

const FIRST_YEAR = 1900;
const MAX_YEARS_AHEAD = 2;

/** Un año entero, desde 1900 (un recuerdo) hasta dos años vista (un viaje que se está planeando), y un mes de 1 a 12 si lo hay. */
export function isValidTripDate(year: number, month: number | undefined, now: Date): boolean {
  const validYear = Number.isInteger(year) && year >= FIRST_YEAR && year <= now.getUTCFullYear() + MAX_YEARS_AHEAD;
  const validMonth = month === undefined || (Number.isInteger(month) && month >= 1 && month <= 12);
  return validYear && validMonth;
}

export function isValidTripCountry(code: string): boolean {
  return isCountryCode(code);
}

/** Del más reciente al más antiguo; sin mes, al final de su año. */
export function byNewestTrip(a: Pick<Trip, "year" | "month">, b: Pick<Trip, "year" | "month">): number {
  return b.year - a.year || (b.month ?? 0) - (a.month ?? 0);
}

/** Puerto — ADR-03 apartado 3.3. */
export interface TripRepository {
  findByUserId(userId: string): Promise<Trip[]>;
  save(trip: Trip): Promise<void>;
  /** Borra un viaje de ese usuario; `false` si no existía o no era suyo. */
  delete(userId: string, tripId: string): Promise<boolean>;
  /** Borra todos los del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
