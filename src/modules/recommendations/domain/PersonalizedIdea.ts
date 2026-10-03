import type { Locale } from "#shared/domain/locales.js";

/**
 * RF-40: versión personalizada de una idea del catálogo para una recomendación,
 * en un idioma. Se reutiliza mientras no cambien las opciones de "¿Qué te
 * ayuda?" con las que se escribió (v1.1).
 */
export interface PersonalizedIdea {
  readonly recommendationId: string;
  readonly userId: string;
  readonly locale: Locale;
  /** Idea del catálogo que reescribió la IA (la "original" que se puede ver). */
  readonly templateKey: string;
  readonly text: string;
  /** Opciones de "¿Qué te ayuda?" (RF-41) con las que se escribió. */
  readonly experienceTags: readonly string[];
  /** Qué la escribió ("fake" o el modelo real), para la evaluación y la transparencia. */
  readonly model: string;
  readonly createdAt: Date;
}

export interface PersonalizedIdeaRepository {
  find(recommendationId: string, templateKey: string, locale: Locale): Promise<PersonalizedIdea | undefined>;
  findByUserId(userId: string): Promise<PersonalizedIdea[]>;
  /** Sustituye la que hubiera para la misma (recomendación, plantilla, idioma). */
  save(idea: PersonalizedIdea): Promise<void>;
  /** Al desactivar la función y con el derecho al olvido (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
