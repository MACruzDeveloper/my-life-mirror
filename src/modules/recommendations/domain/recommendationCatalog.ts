/**
 * RF-18 / RD-09. Catálogo curado de plantillas de recomendación (cinco por
 * categoría desde RF-40a: redactadas con ayuda de IA y revisadas por el autor;
 * la IA de RF-40 solo puede elegir y reescribir estas, nunca inventar). Aquí solo viven las *claves*; los textos, en las
 * traducciones (`recomendaciones.<clave>` en i18n). Cada categoría estándar
 * tiene sus propias plantillas; cualquier otra (p. ej. creada por el admin,
 * ADM-02) usa las generales, que llevan el nombre de la categoría.
 * Las claves son las estables del catálogo estándar (`standardCategories.ts`).
 */
const TEMPLATES_BY_CATEGORY_KEY: Record<string, string[]> = {
  economia: ["economia.1", "economia.2", "economia.3", "economia.4", "economia.5"],
  vidaSocial: ["vidaSocial.1", "vidaSocial.2", "vidaSocial.3", "vidaSocial.4", "vidaSocial.5"],
  pareja: ["pareja.1", "pareja.2", "pareja.3", "pareja.4", "pareja.5"],
  sexo: ["sexo.1", "sexo.2", "sexo.3", "sexo.4", "sexo.5"],
  deporte: ["deporte.1", "deporte.2", "deporte.3", "deporte.4", "deporte.5"],
  aventura: ["aventura.1", "aventura.2", "aventura.3", "aventura.4", "aventura.5"],
  espiritualidad: ["espiritualidad.1", "espiritualidad.2", "espiritualidad.3", "espiritualidad.4", "espiritualidad.5"],
  familia: ["familia.1", "familia.2", "familia.3", "familia.4", "familia.5"],
  inversiones: ["inversiones.1", "inversiones.2", "inversiones.3", "inversiones.4", "inversiones.5"],
};

export const GENERAL_TEMPLATE_KEYS: string[] = ["general.1", "general.2", "general.3"];

/** Por la clave estable de la categoría estándar (`CatalogCategory.key`), no por su nombre. */
export function templateKeysFor(categoryKey: string | undefined): string[] {
  return (categoryKey && TEMPLATES_BY_CATEGORY_KEY[categoryKey]) || GENERAL_TEMPLATE_KEYS;
}

/** Se recomienda cuando la puntuación es MENOR que el umbral (con 5: de 1 a 4). */
export const DEFAULT_THRESHOLD = 5;
const MIN_THRESHOLD = 2;
const MAX_THRESHOLD = 10;

/** Lee el umbral configurable (variable de entorno); cualquier valor ausente o inválido usa el de por defecto. */
export function parseThreshold(value: string | undefined): number {
  const text = value?.trim() ?? "";
  if (!/^\d+$/.test(text)) return DEFAULT_THRESHOLD;
  const parsed = Number(text);
  return parsed >= MIN_THRESHOLD && parsed <= MAX_THRESHOLD ? parsed : DEFAULT_THRESHOLD;
}
