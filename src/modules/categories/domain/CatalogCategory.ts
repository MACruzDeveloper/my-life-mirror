import type { Locale } from "../../../shared/domain/locales.js";

/** Nombre y descripción de una categoría en un idioma. */
export interface CategoryText {
  readonly name: string;
  readonly description: string;
}

/**
 * ADM-02 / RNF-10. Entrada del catálogo global de categorías, que gestiona el
 * admin. Las categorías de cada usuario (`Category`) apuntan aquí por
 * `catalogId`.
 * - `translations`: el texto en cada idioma, sin columnas por idioma — añadir
 *   un idioma no cambia el modelo. El idioma por defecto siempre está.
 * - `key`: identificador estable de las 9 estándar (lo usan los ejemplos y las
 *   plantillas de recomendación); las del admin no tienen.
 * - `retiredAt` en vez de borrar: retirar una categoría no destruye las
 *   evaluaciones de nadie (RF-12).
 * - `isSensitiveData` no se puede cambiar tras crearla (afectaría a
 *   consentimientos ya dados).
 */
export interface CatalogCategory {
  readonly id: string;
  readonly key?: string;
  readonly translations: Partial<Record<Locale, CategoryText>>;
  readonly isSensitiveData: boolean;
  readonly retiredAt?: Date;
}
