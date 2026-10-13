import { isIsoDay, isoDayFrom } from "#shared/domain/isoDay.js";

/**
 * RF-19: lo que una persona decide sobre una idea del carrusel. Son las tres
 * salidas del requisito, aplicadas a cada idea: guardarla para después
 * ("pospuesta"), darla por hecha, o apartarla ("descartada").
 */
export const IDEA_REACTIONS = ["saved", "done", "discarded"] as const;
export type IdeaReactionKind = (typeof IDEA_REACTIONS)[number];

/**
 * Una reacción por idea y categoría del usuario. Se guarda la clave de la idea
 * del catálogo (`economia.2`), nunca su texto: así se muestra en el idioma de
 * la interfaz y vale igual si se vio personalizada por la IA (RF-40).
 */
export interface IdeaReaction {
  readonly userId: string;
  readonly categoryId: string;
  readonly templateKey: string;
  readonly reaction: IdeaReactionKind;
  readonly reactedAt: Date;
  /** RF-47: día orientativo ("AAAA-MM-DD") para probar una idea guardada; nunca un plazo. */
  readonly plannedFor?: string;
}

/** Hasta cuándo se puede fechar una idea: un año vista. */
const MAX_PLAN_DAYS_AHEAD = 366;

/**
 * RF-47: una fecha vale si es un día real, de hoy a un año. "Hoy" admite un
 * día de margen: el servidor cuenta en UTC y la persona, en su zona horaria.
 */
export function isValidPlanDate(value: string, now: Date): boolean {
  return isIsoDay(value) && value >= isoDayFrom(now, -1) && value <= isoDayFrom(now, MAX_PLAN_DAYS_AHEAD);
}

/** Puerto — ADR-03 apartado 3.3. */
export interface IdeaReactionRepository {
  findByUserId(userId: string): Promise<IdeaReaction[]>;
  /** Guarda o sustituye la reacción a esa idea (una por usuario, categoría e idea). */
  save(reaction: IdeaReaction): Promise<void>;
  /** Quita la reacción a esa idea. Repetible: no falla si no existía. */
  delete(userId: string, categoryId: string, templateKey: string): Promise<void>;
  /** Borra todas las del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
