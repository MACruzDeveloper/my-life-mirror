/**
 * RF-18 / RD-09. Catálogo curado de plantillas de recomendación (no generado
 * por IA: RES-09). Aquí solo viven las *claves*; los textos, en las
 * traducciones (`recomendaciones.<clave>` en i18n). Cada categoría estándar
 * tiene sus propias plantillas; cualquier otra (p. ej. creada por el admin,
 * ADM-02) usa las generales, que llevan el nombre de la categoría.
 * Los nombres son los del catálogo estándar (`standardCategories.ts`).
 */
const TEMPLATES_BY_CATEGORY: Record<string, string[]> = {
  Economía: ["economia.1", "economia.2"],
  "Vida social": ["vidaSocial.1", "vidaSocial.2"],
  Pareja: ["pareja.1", "pareja.2"],
  Sexo: ["sexo.1", "sexo.2"],
  Deporte: ["deporte.1", "deporte.2"],
  Aventura: ["aventura.1", "aventura.2"],
  Espiritualidad: ["espiritualidad.1", "espiritualidad.2"],
  Familia: ["familia.1", "familia.2"],
  Inversiones: ["inversiones.1", "inversiones.2"],
};

export const GENERAL_TEMPLATE_KEYS: string[] = ["general.1", "general.2", "general.3"];

export function templateKeysFor(categoryName: string): string[] {
  return TEMPLATES_BY_CATEGORY[categoryName] ?? GENERAL_TEMPLATE_KEYS;
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
