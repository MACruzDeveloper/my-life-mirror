import terms from "./catalog/offensiveTerms.json" with { type: "json" };
import { termToPattern } from "./ideaSafety.js";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Mismo formato que el filtro de ideas (`termToPattern`): sin tildes, palabra entera o prefijo con `*`. */
const PATTERNS: readonly RegExp[] = [...terms.es, ...terms.en].map(termToPattern);

/**
 * RF-45 v1.4: ¿lleva la experiencia insultos o palabras ofensivas? Solo se usa
 * al pulsar "Sugerir opciones con IA", para avisar antes de enviar (el usuario
 * decide). Nunca valora cómo se siente la persona: "estoy fatal" o "no puedo
 * más" no avisan (sería detectar riesgo, RES-09), y el diario no se valida.
 * Lista curada en `catalog/offensiveTerms.json`.
 */
export function hasOffensiveTerms(text: string): boolean {
  const normalized = normalize(text);
  return PATTERNS.some((pattern) => pattern.test(normalized));
}
