/**
 * RF-49: un hito de la página de una categoría: algo conseguido (un reto
 * superado en Aventura, una carrera o una marca en Deporte). Es un recuerdo y
 * una motivación, no una evaluación: no cambia ninguna puntuación (RN-04).
 * El título es texto libre y privado, como el de los eventos (RF-48): no se
 * envía a la IA, no se comparte y no se analiza (RES-09).
 */
export interface Milestone {
  readonly id: string;
  readonly userId: string;
  /** Clave estable de la categoría del catálogo, de `MILESTONE_CATEGORIES`. */
  readonly categoryKey: MilestoneCategory;
  readonly title: string;
  readonly year: number;
  /** De 1 (enero) a 12; sin valor si no se recuerda. */
  readonly month?: number;
  readonly createdAt: Date;
}

/** Las páginas de categoría que tienen hitos. */
export const MILESTONE_CATEGORIES = ["aventura", "deporte"] as const;
export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

export const MAX_MILESTONE_TITLE_LENGTH = 80;
/** De sobra para una vida de logros, y la lista que se devuelve tiene límite. */
export const MAX_MILESTONES_PER_USER = 200;

const FIRST_YEAR = 1900;

export function isMilestoneCategory(key: string): key is MilestoneCategory {
  return (MILESTONE_CATEGORIES as readonly string[]).includes(key);
}

/** Algo conseguido: un año entero de 1900 al actual (no del futuro) y un mes de 1 a 12 si lo hay. */
export function isValidMilestoneDate(year: number, month: number | undefined, now: Date): boolean {
  const validYear = Number.isInteger(year) && year >= FIRST_YEAR && year <= now.getUTCFullYear();
  const validMonth = month === undefined || (Number.isInteger(month) && month >= 1 && month <= 12);
  return validYear && validMonth;
}

/** Puerto — ADR-03 apartado 3.3. */
export interface MilestoneRepository {
  findByUserId(userId: string): Promise<Milestone[]>;
  save(milestone: Milestone): Promise<void>;
  /** Borra un hito de ese usuario; `false` si no existía o no era suyo. */
  delete(userId: string, milestoneId: string): Promise<boolean>;
  /** Borra todos los del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
