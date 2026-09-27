import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import type { CatalogLabelDto } from "@modules/categories/ui/queries";

/** `catalogId` de fixture de una categoría estándar en los tests de pantallas: `k-<clave>`. */
export const catalogIdOf = (key: string) => `k-${key}`;

/**
 * Respuesta de fixture de `GET /api/categories/translations`: las 9 estándar
 * (con su clave y su texto en cada idioma) más las que se añadan.
 */
export function categoryLabelsFixture(extra: CatalogLabelDto[] = []): CatalogLabelDto[] {
  return [
    ...STANDARD_CATEGORIES.map((standard) => ({ catalogId: catalogIdOf(standard.key), key: standard.key, translations: standard.translations })),
    ...extra,
  ];
}
