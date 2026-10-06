import ideas from "./catalog/ideas.json" with { type: "json" };

/**
 * RF-18 / RD-09. Catálogo curado de plantillas de recomendación (cinco por
 * categoría desde RF-40a: redactadas con ayuda de IA y revisadas por el autor;
 * la IA de RF-40 solo puede reescribir estas, nunca inventar). Las claves y su
 * categoría viven como datos en `catalog/ideas.json` (CAT-01); los textos, en las
 * traducciones (`recomendaciones.plantillas.<clave>`). Cada categoría estándar
 * tiene sus propias plantillas; cualquier otra (p. ej. creada por el admin,
 * ADM-02) usa las generales (`category: null`), que llevan el nombre de la categoría.
 */
const TEMPLATES_BY_CATEGORY_KEY: Readonly<Record<string, string[]>> = ideas.reduce<Record<string, string[]>>((byCategory, idea) => {
  if (idea.category !== null) (byCategory[idea.category] ??= []).push(idea.key);
  return byCategory;
}, {});

export const GENERAL_TEMPLATE_KEYS: string[] = ideas.filter((idea) => idea.category === null).map((idea) => idea.key);

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
