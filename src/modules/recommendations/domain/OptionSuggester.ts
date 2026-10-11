import type { Locale } from "#shared/domain/locales.js";

/** Una opción de las listas cerradas, con su texto en el idioma de la petición. */
export interface OptionLabel {
  key: string;
  label: string;
}

/**
 * RF-45 (historia Nivel 3, que manda sobre este contrato). Lo único que recibe la
 * IA: el texto de la experiencia ya sin datos personales, la clave de la
 * categoría y las opciones posibles. Nunca ids, nombre, email ni puntuaciones.
 */
export interface SuggestOptionsRequest {
  locale: Locale;
  categoryKey: string;
  text: string;
  /** Opciones de "¿Qué te ayuda?" (RF-41) que aún no tiene marcadas. */
  helps: OptionLabel[];
  /** Situaciones de RF-42 que aún no tiene marcadas. */
  difficulties: OptionLabel[];
}

/** Solo claves: la salida se valida contra las opciones de la petición y nunca se enseña texto de la IA. */
export interface OptionSuggestion {
  helps: string[];
  difficulties: string[];
}

/** Por qué no hay sugerencias cuando no es que "no haya nada nuevo que proponer": tope diario agotado (RF-40b) o proveedor caído. */
export const SUGGESTION_NOTICES = ["limit", "unavailable"] as const;
export type SuggestionNotice = (typeof SUGGESTION_NOTICES)[number];

/** Lo que devuelve el caso de uso: las claves y, si no se pudo preguntar, el motivo (la interfaz lo dice). */
export type SuggestionOutcome = OptionSuggestion & { notice?: SuggestionNotice };

/** Puerto: quien traduce una experiencia a las listas cerradas (un *Fake* o el modelo real, RF-40b). Puede lanzar o tardar. */
export interface OptionSuggester {
  suggest(request: SuggestOptionsRequest): Promise<OptionSuggestion>;
}
