import terms from "./catalog/safetyTerms.json" with { type: "json" };
import { normalize, termToPattern } from "./ideaSafety.js";
import { hasOffensiveTerms } from "./offensiveTerms.js";
import { redactPersonalData } from "./redactPersonalData.js";

export const SHAREABLE_TEXT_REASONS = ["contact", "health", "offensive"] as const;
export type ShareableTextReason = (typeof SHAREABLE_TEXT_REASONS)[number];

export type ShareableTextResult = { ok: true } | { ok: false; reason: ShareableTextReason };

/**
 * Solo los grupos de salud y dinero del filtro de ideas: "debes" o "vago" son
 * normales al contar algo propio, pero la app no difunde entre usuarios consejo
 * clínico, profesional ni financiero (RES-05).
 */
const HEALTH_GROUPS = ["lenguajeClinico", "consejoProfesional", "consejoFinanciero"] as const;
const { es, en } = terms as unknown as Record<"es" | "en", Record<string, string[]>>;
const HEALTH_PATTERNS: readonly RegExp[] = HEALTH_GROUPS.flatMap((group) => [...(es[group] ?? []), ...(en[group] ?? [])]).map(termToPattern);

/**
 * RF-43: ¿se puede publicar esta experiencia para que la lean otras personas?
 * Solo se mira el texto que se va a publicar, nunca cómo está quien lo escribe:
 * "estaba fatal" se puede compartir (valorarlo sería detectar riesgo, RES-09).
 * El diario privado no pasa por aquí.
 */
export function checkShareableText(text: string): ShareableTextResult {
  if (redactPersonalData(text) !== text) return { ok: false, reason: "contact" };
  const normalized = normalize(text);
  if (HEALTH_PATTERNS.some((pattern) => pattern.test(normalized))) return { ok: false, reason: "health" };
  if (hasOffensiveTerms(text)) return { ok: false, reason: "offensive" };
  return { ok: true };
}
