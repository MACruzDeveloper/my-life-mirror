/**
 * RF-18 / RD-09. Catálogo curado de plantillas de recomendación (no generado
 * por IA: RES-09). Aquí solo viven las *claves*; los textos, en las
 * traducciones (`recomendaciones.<clave>` en i18n). Cada categoría estándar
 * tiene sus propias plantillas; cualquier otra (p. ej. creada por el admin,
 * ADM-02) usa las generales, que llevan el nombre de la categoría.
 * Las claves son las estables del catálogo estándar (`standardCategories.ts`).
 */
const TEMPLATES_BY_CATEGORY_KEY: Record<string, string[]> = {
  economia: ["economia.1", "economia.2"],
  vidaSocial: ["vidaSocial.1", "vidaSocial.2"],
  pareja: ["pareja.1", "pareja.2"],
  sexo: ["sexo.1", "sexo.2"],
  deporte: ["deporte.1", "deporte.2"],
  aventura: ["aventura.1", "aventura.2"],
  espiritualidad: ["espiritualidad.1", "espiritualidad.2"],
  familia: ["familia.1", "familia.2"],
  inversiones: ["inversiones.1", "inversiones.2"],
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
  const texto = value?.trim() ?? "";
  if (!/^\d+$/.test(texto)) return DEFAULT_THRESHOLD;
  const numero = Number(texto);
  return numero >= MIN_THRESHOLD && numero <= MAX_THRESHOLD ? numero : DEFAULT_THRESHOLD;
}
