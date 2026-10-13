import type { Locale } from "#shared/domain/locales.js";

/**
 * RF-40. Contratos de la personalización de ideas (ver la historia RF-40, Nivel 3).
 * La petición lleva solo lo necesario: nunca nombre, email, ids, notas ni la
 * experiencia privada del usuario, ni nada de categorías sensibles. Todo lo que
 * describe a la persona sale de listas cerradas (RF-41, RF-46), nunca de texto suyo.
 */
export const IDEA_TRENDS = ["first", "up", "down", "steady"] as const;
export type IdeaTrend = (typeof IDEA_TRENDS)[number];

export interface IdeaCandidate {
  templateKey: string;
  text: string;
}

export interface IdeaRequest {
  locale: Locale;
  /** Clave estable de la categoría (`deporte`), no su id ni su nombre. */
  categoryKey: string;
  score: number;
  trend: IdeaTrend;
  /** Textos de las opciones de RF-41 marcadas, ya en `locale`. */
  helpfulThings: string[];
  /** RF-46: su profesión, de la lista cerrada del perfil, ya en `locale`; sin valor si no la indicó. */
  occupation?: string;
  /** RF-46: sus aficiones, de la lista cerrada del perfil, ya en `locale`. */
  hobbies?: string[];
  /** Ideas del catálogo curado de la categoría, en `locale`: la IA solo puede elegir y reescribir una. */
  candidates: IdeaCandidate[];
}

export interface IdeaDraft {
  templateKey: string;
  text: string;
}

/** Puerto: escribe la versión personalizada (puede fallar o tardar; quien lo usa lo controla). */
export interface IdeaWriter {
  readonly model: string;
  write(request: IdeaRequest): Promise<IdeaDraft>;
}

/** Puerto: segunda revisión del borrador (tono, juicio, consejo profesional). */
export interface IdeaReviewer {
  review(draft: IdeaDraft, request: IdeaRequest): Promise<{ approved: boolean; reasons: string[] }>;
}
