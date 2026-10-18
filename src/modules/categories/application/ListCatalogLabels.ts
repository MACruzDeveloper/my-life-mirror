import type { Locale } from "#shared/domain/locales.js";
import type { CategoryText } from "../domain/CatalogCategory.js";
import type { CategoryCatalogRepository } from "../domain/CategoryCatalogRepository.js";

export interface CatalogLabel {
  catalogId: string;
  key?: string;
  /** RF-45: fuera de la IA (la interfaz no ofrece sugerencias en ella). */
  aiExcluded?: boolean;
  /** Retirada (ADM-02): no se ofrece, pero el historial la nombra. */
  retired?: boolean;
  translations: Partial<Record<Locale, CategoryText>>;
}

/**
 * Caso de uso de solo lectura — RNF-10. El texto de cada categoría del
 * catálogo en cada idioma, para que la interfaz nombre las categorías por su
 * `catalogId`. Incluye las retiradas: el historial todavía las nombra. No es
 * un dato personal (es el catálogo común), así que basta con tener sesión.
 */
export function createListCatalogLabels(catalog: CategoryCatalogRepository) {
  return async function listCatalogLabels(): Promise<CatalogLabel[]> {
    return (await catalog.findAll()).map((entry) => ({
      catalogId: entry.id,
      ...(entry.key ? { key: entry.key } : {}),
      ...(entry.aiExcluded ? { aiExcluded: true } : {}),
      // Retirada: no se ofrece (p. ej. en Categorías), pero el historial la sigue nombrando.
      ...(entry.retiredAt ? { retired: true } : {}),
      translations: entry.translations,
    }));
  };
}
