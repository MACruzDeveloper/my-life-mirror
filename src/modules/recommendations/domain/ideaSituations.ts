import situations from "./catalog/situations.json" with { type: "json" };
import { GENERAL_TEMPLATE_KEYS, templateKeysFor } from "./recommendationCatalog.js";

/**
 * RF-42. Situaciones que pueden poner difícil una categoría: lista cerrada y
 * general, de situaciones, nunca rasgos ni condiciones de salud, cada una con
 * las ideas con las que choca. Contenido curado (RD-09) como datos en
 * `catalog/situations.json` (CAT-01), en el orden en que se ofrecen; lo revisa el
 * autor. Los textos viven en i18n (`situaciones.<clave>`). Nunca se envían a la
 * IA: las ideas que chocan se quitan antes.
 */
export const DIFFICULT_SITUATIONS: readonly string[] = situations.map((situation) => situation.key);
export type DifficultSituation = (typeof DIFFICULT_SITUATIONS)[number];

/** Ideas del catálogo que chocan con cada situación (no se proponen a quien la marque). */
const CLASHING_TEMPLATES: Readonly<Record<string, readonly string[]>> = Object.fromEntries(situations.map((situation) => [situation.key, situation.clashesWith]));

function isSituation(value: string): value is DifficultSituation {
  return DIFFICULT_SITUATIONS.includes(value);
}

/** Situaciones que se ofrecen en una categoría: las que chocan con alguna de sus ideas, en el orden de la lista. */
export function situationOptionsFor(categoryKey: string | undefined): DifficultSituation[] {
  const templates = new Set(templateKeysFor(categoryKey));
  return DIFFICULT_SITUATIONS.filter((situation) => CLASHING_TEMPLATES[situation].some((template) => templates.has(template)));
}

/**
 * Ideas que se pueden proponer en una categoría con esas situaciones marcadas:
 * las suyas que no chocan; si chocan todas, las generales que no choquen.
 */
export function allowedTemplateKeys(categoryKey: string | undefined, difficultyTags: readonly string[]): string[] {
  const clashing = new Set(difficultyTags.filter(isSituation).flatMap((situation) => CLASHING_TEMPLATES[situation]));
  const own = templateKeysFor(categoryKey).filter((template) => !clashing.has(template));
  return own.length > 0 ? own : GENERAL_TEMPLATE_KEYS.filter((template) => !clashing.has(template));
}
