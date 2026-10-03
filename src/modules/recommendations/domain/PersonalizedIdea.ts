import type { Locale } from "../../../shared/domain/locales.js";

/** RF-40: versión personalizada de una recomendación, en un idioma. Se escribe una vez y se reutiliza. */
export interface PersonalizedIdea {
  readonly recommendationId: string;
  readonly userId: string;
  readonly locale: Locale;
  /** Idea del catálogo que eligió y reescribió la IA (la "original" que se puede ver). */
  readonly templateKey: string;
  readonly text: string;
  /** Qué la escribió ("fake" o el modelo real), para la evaluación y la transparencia. */
  readonly model: string;
  readonly createdAt: Date;
}

export interface PersonalizedIdeaRepository {
  find(recommendationId: string, locale: Locale): Promise<PersonalizedIdea | undefined>;
  findByUserId(userId: string): Promise<PersonalizedIdea[]>;
  save(idea: PersonalizedIdea): Promise<void>;
  /** Al desactivar la función y con el derecho al olvido (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
