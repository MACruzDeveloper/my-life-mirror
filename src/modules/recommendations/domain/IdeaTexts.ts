import type { Locale } from "#shared/domain/locales.js";
import type { IdeaCandidate } from "./IdeaWriter.js";

/** Puerto: textos curados que la IA puede usar, leídos en el servidor (RF-40). */
export interface IdeaTexts {
  /** Ideas del catálogo de una categoría estándar, en ese idioma; vacío si no tiene propias. */
  candidatesFor(categoryKey: string, locale: Locale): IdeaCandidate[];
  /** Textos de las opciones de RF-41, en ese idioma; las desconocidas se descartan. */
  experienceLabels(tags: readonly string[], locale: Locale): string[];
}
