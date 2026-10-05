import helpOptions from "./catalog/helpOptions.json" with { type: "json" };

/**
 * RF-41. Opciones cerradas de "¿Qué te ayuda?", por clave de categoría
 * estándar. Lista cerrada a propósito: es lo único que podrá usar la IA para
 * personalizar ideas (RF-40), y así nunca recibe texto libre (RES-09).
 * Contenido curado como datos en `catalog/helpOptions.json` (CAT-01); los textos
 * viven en i18n (`experiencias.<clave>`).
 */

/** Claves completas (`deporte.caminar`) de una categoría; vacío si no tiene clave o no se conoce. */
export function experienceOptionsFor(categoryKey: string | undefined): string[] {
  return categoryKey ? helpOptions.filter((option) => option.category === categoryKey).map((option) => option.key) : [];
}
