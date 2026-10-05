import { GENERAL_TEMPLATE_KEYS, templateKeysFor } from "./recommendationCatalog.js";

/**
 * RF-42. Situaciones que pueden poner difícil una categoría: lista cerrada y
 * general, de situaciones, nunca rasgos ni condiciones de salud. Contenido
 * curado (RD-09): ver la tabla de la historia RF-42, que revisa el autor.
 * Los textos viven en i18n (`situaciones.<clave>`). Nunca se envían a la IA:
 * las ideas que chocan se quitan antes.
 */
export const DIFFICULT_SITUATIONS = [
  "salirDeCasa",
  "sitiosConGente",
  "darElPrimerPaso",
  "actividadesEnGrupo",
  "hablarDeLoQueSiento",
  "llamarPorTelefono",
  "contactoConFamilia",
  "apuntarYRegistrar",
  "mirarMisCuentas",
  "cambiosDeRutina",
  "pocoTiempoLibre",
] as const;
export type DifficultSituation = (typeof DIFFICULT_SITUATIONS)[number];

/** Ideas del catálogo que chocan con cada situación (no se proponen a quien la marque). */
const CLASHING_TEMPLATES: Readonly<Record<DifficultSituation, readonly string[]>> = {
  salirDeCasa: ["deporte.1", "deporte.4", "deporte.5", "aventura.1", "aventura.4", "espiritualidad.5", "vidaSocial.2"],
  sitiosConGente: ["vidaSocial.5", "aventura.4"],
  darElPrimerPaso: ["vidaSocial.1", "vidaSocial.2", "vidaSocial.3", "vidaSocial.5", "familia.2", "familia.4"],
  actividadesEnGrupo: ["vidaSocial.3", "vidaSocial.5"],
  hablarDeLoQueSiento: ["economia.5", "pareja.3", "sexo.1", "familia.5"],
  llamarPorTelefono: ["familia.1"],
  contactoConFamilia: ["familia.1", "familia.2", "familia.3", "familia.4", "familia.5"],
  apuntarYRegistrar: ["economia.1", "economia.4", "aventura.2", "espiritualidad.2", "inversiones.3", "general.1"],
  mirarMisCuentas: ["economia.1", "inversiones.1"],
  cambiosDeRutina: ["aventura.1", "pareja.4", "deporte.4"],
  pocoTiempoLibre: ["deporte.2", "inversiones.1"],
};

function isSituation(value: string): value is DifficultSituation {
  return (DIFFICULT_SITUATIONS as readonly string[]).includes(value);
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
