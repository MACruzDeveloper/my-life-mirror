import terms from "./ideaSafetyTerms.json" with { type: "json" };
import type { IdeaDraft, IdeaRequest } from "./IdeaWriter.js";

export const IDEA_SAFETY_REASONS = ["templateKey", "length", "blocked"] as const;
export type IdeaSafetyReason = (typeof IDEA_SAFETY_REASONS)[number];

export type IdeaSafetyResult = { safe: true } | { safe: false; reason: IdeaSafetyReason; detail?: string };

const MIN_LENGTH = 40;
const MAX_LENGTH = 400;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Convierte un término de `ideaSafetyTerms.json` en su patrón: sin tildes ni
 * mayúsculas, palabras separadas por cualquier espacio, palabra entera salvo
 * que acabe en `*` (entonces admite lo que siga: `fracas*` → fracasado).
 */
export function termToPattern(term: string): RegExp {
  const prefix = term.trim().endsWith("*");
  const words = normalize(term.trim().replace(/\*$/, ""))
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b${words.join("\\s+")}${prefix ? "" : "\\b"}`);
}

/** Lo que no son palabras: nunca mandar al usuario a terceros (enlaces, correos, teléfonos). */
const CONTACT_PATTERNS: readonly RegExp[] = [/https?:\/\//, /\bwww\./, /[^\s@]+@[^\s@]+\.[a-z]{2,}/, /(\d[\s-]?){7,}/];

const { es, en } = terms as unknown as Record<"es" | "en", Record<string, string[]>>;
const BLOCKED_PATTERNS: readonly RegExp[] = [...Object.values(es).flat(), ...Object.values(en).flat()].map(termToPattern).concat(CONTACT_PATTERNS);

/** RF-40: filtro determinista de lo que escribe la IA (no de lo que escribe el usuario: RES-09). */
export function checkIdeaSafety(draft: IdeaDraft, request: IdeaRequest): IdeaSafetyResult {
  if (!request.candidates.some((candidate) => candidate.templateKey === draft.templateKey)) return { safe: false, reason: "templateKey" };
  const length = draft.text.trim().length;
  if (length < MIN_LENGTH || length > MAX_LENGTH) return { safe: false, reason: "length" };
  const text = normalize(draft.text);
  const hit = BLOCKED_PATTERNS.find((pattern) => pattern.test(text));
  if (hit) return { safe: false, reason: "blocked", detail: hit.source };
  return { safe: true };
}
