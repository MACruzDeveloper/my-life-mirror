import { DomainError } from "#shared/domain/DomainError.js";
import type { Locale } from "#shared/domain/locales.js";
import type { ShareableTextReason } from "#modules/recommendations/domain/shareableText.js";

/**
 * RF-44: una experiencia del diario de una categoría. Privada: solo la ve el
 * usuario y nunca va a la IA (salvo que él lo pida para una concreta, RF-45)
 * ni a otras personas (salvo que la comparta, RF-43).
 * Separada de las evaluaciones, que son inmutables (RF-12), para poder borrarla.
 */
export interface Experience {
  readonly id: string;
  readonly userId: string;
  readonly categoryId: string;
  readonly text: string;
  readonly createdAt: Date;
  /** RF-43: compartida de forma anónima desde esta fecha; ausente = privada. */
  readonly sharedAt?: Date;
  /** RF-43: el idioma en que se escribió (solo la leen quienes usan la app en ese idioma). */
  readonly sharedLocale?: Locale;
  /** RF-43: la clave de su categoría en el catálogo (`economia`), para buscarla sin cruzar tablas. */
  readonly sharedCategoryKey?: string;
  /** RF-43: reportada por otra persona: deja de verse y no se puede volver a compartir. */
  readonly reportedAt?: Date;
}

export const MAX_EXPERIENCE_LENGTH = 500;

/** RF-43: lo que ve quien lee una experiencia compartida: solo el texto (y su id, para reportarla). */
export interface SharedExperience {
  readonly id: string;
  readonly text: string;
}

/** RF-43: última puntuación mínima de la categoría para compartir una experiencia. */
export const SHARE_MIN_SCORE = 8;
/** RF-43: cuántas se enseñan como mucho en la ventana de ideas. */
export const MAX_SHARED_LISTED = 10;

export type ShareRejectionReason = "score" | "category" | "reported" | ShareableTextReason;

/** RF-43: no se puede compartir; `reason` le dice al usuario qué pasa (la interfaz lo traduce). */
export class NotShareableError extends DomainError {
  readonly code = "NOT_SHAREABLE";
  readonly reason: ShareRejectionReason;

  constructor(reason: ShareRejectionReason) {
    super(`Experience cannot be shared: ${reason}`);
    this.reason = reason;
  }
}

/** Puerto — ADR-03 apartado 3.3. */
export interface ExperienceRepository {
  findByUserId(userId: string): Promise<Experience[]>;
  save(experience: Experience): Promise<void>;
  /** Borra la experiencia si es de ese usuario; `false` si no existe o es de otro. */
  delete(userId: string, experienceId: string): Promise<boolean>;
  /** Borra todas las del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
  /** RF-43: las compartidas y no reportadas de esa categoría e idioma, sin las de `excludeUserId`, la compartida más recientemente primero. */
  findShared(query: { categoryKey: string; locale: Locale; excludeUserId: string; limit: number }): Promise<SharedExperience[]>;
  /** RF-43: la marca como reportada si está compartida, no reportada y no es de `reporterId`; `false` si no. */
  report(experienceId: string, reporterId: string, at: Date): Promise<boolean>;
}
