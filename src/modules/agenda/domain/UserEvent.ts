import { isIsoDay, isoDayFrom } from "#shared/domain/isoDay.js";

/**
 * RF-48: algo que la persona tiene por delante (o que ya pasó) y quiere ver en
 * su calendario: un título corto, un día y, si quiere, las categorías con las
 * que tiene que ver (una boda: vida social y familia).
 * El título es texto libre y privado: no se envía a la IA, no se comparte y no
 * se analiza (RES-09). Un evento nunca cambia una puntuación: pasado el día,
 * la app solo invita a revisarla (RN-04).
 */
export interface UserEvent {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  /** Día sin hora, "AAAA-MM-DD". */
  readonly day: string;
  /** Categorías propias con las que tiene que ver; puede no tener ninguna. */
  readonly categoryIds: readonly string[];
  readonly createdAt: Date;
}

export const MAX_EVENT_TITLE_LENGTH = 80;
/** Un evento toca pocas categorías: con más, la invitación a revisarlas dejaría de servir. */
export const MAX_EVENT_CATEGORIES = 5;
/** Tope por persona: de sobra para un calendario personal, y la lista que se devuelve tiene límite. */
export const MAX_EVENTS_PER_USER = 200;

const MAX_DAYS_BACK = 366;
const MAX_DAYS_AHEAD = 731;

/** Un día real, de un año atrás (anotar algo que ya ocurrió) a dos años vista. */
export function isValidEventDay(value: string, now: Date): boolean {
  return isIsoDay(value) && value >= isoDayFrom(now, -MAX_DAYS_BACK) && value <= isoDayFrom(now, MAX_DAYS_AHEAD);
}

/** Puerto — ADR-03 apartado 3.3. */
export interface EventRepository {
  findByUserId(userId: string): Promise<UserEvent[]>;
  save(event: UserEvent): Promise<void>;
  /** Borra un evento de ese usuario; `false` si no existía o no era suyo. */
  delete(userId: string, eventId: string): Promise<boolean>;
  /** Borra todos los del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
