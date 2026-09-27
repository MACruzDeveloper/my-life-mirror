import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, isSupportedLocale } from "@shared/domain/locales";
import { useCategoryLabelsQuery, type CatalogLabelDto } from "./queries";

export interface CategoryLabel {
  name: string;
  description: string;
  /** Clave estable de las categorías estándar (ejemplos de la entrevista, plantillas). */
  key?: string;
}

const EMPTY_LABEL: CategoryLabel = { name: "", description: "" };

/**
 * RNF-10. Texto de una categoría en un idioma, buscado por su `catalogId`
 * (una sola referencia, sin campos por idioma). Si falta ese idioma, se usa el
 * de por defecto; un id desconocido da texto vacío en vez de romper la pantalla.
 */
export function resolveCategoryLabel(labelsById: Map<string, CatalogLabelDto>, catalogId: string | undefined, language: string): CategoryLabel {
  const entry = catalogId ? labelsById.get(catalogId) : undefined;
  if (!entry) return EMPTY_LABEL;
  const locale = isSupportedLocale(language) ? language : DEFAULT_LOCALE;
  const text = entry.translations[locale] ?? entry.translations[DEFAULT_LOCALE];
  if (!text) return EMPTY_LABEL;
  return { name: text.name, description: text.description, ...(entry.key ? { key: entry.key } : {}) };
}

/**
 * Para las páginas: `categoryLabel(catalogId)` en el idioma actual. Los textos
 * de todas las categorías se piden una vez (`GET /api/categories/translations`)
 * y quedan en la caché; cambiar de idioma no repite ninguna llamada. Las
 * pantallas deben esperar a `isPending` antes de pintar nombres.
 */
export function useCategoryLabel() {
  const { i18n } = useTranslation();
  const query = useCategoryLabelsQuery();
  const labelsById = useMemo(() => new Map((query.data ?? []).map((label) => [label.catalogId, label])), [query.data]);
  return {
    categoryLabel: (catalogId: string | undefined) => resolveCategoryLabel(labelsById, catalogId, i18n.language),
    isPending: query.isPending,
    isError: query.isError,
  };
}
