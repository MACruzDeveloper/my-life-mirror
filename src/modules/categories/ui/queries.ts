import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import type { Locale } from "@shared/domain/locales";

export interface CategoryDto {
  id: string;
  /** Identidad en el catálogo: la interfaz nombra la categoría por aquí (ver `useCategoryLabel`). */
  catalogId?: string;
  /** Texto en el idioma por defecto (no se muestra: se usa `useCategoryLabel`). */
  name: string;
  description?: string;
  isSensitiveData?: boolean;
  status: "active" | "inactive";
  /** RF-41: opciones marcadas de "¿Qué te ayuda?" (claves de `experienceOptions`). */
  experienceTags?: string[];
  /** RF-42: situaciones que se lo ponen difícil (claves de `ideaSituations`). */
  difficultyTags?: string[];
}

export interface CatalogLabelDto {
  catalogId: string;
  key?: string;
  /** RF-45: fuera de la IA. */
  aiExcluded?: boolean;
  /** Retirada del catálogo (ADM-02): no se ofrece, pero el historial la nombra. */
  retired?: boolean;
  translations: Partial<Record<Locale, { name: string; description: string }>>;
}

export const CATEGORIES_KEY = ["categories"] as const;
/** Bajo `["categories"]`: añadir o retirar una categoría (admin) invalida también los textos. */
export const CATEGORY_LABELS_KEY = ["categories", "labels"] as const;

/** Categorías del usuario (RF-06), en caché compartida entre pantallas. */
export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: ({ signal }) => getJson<CategoryDto[]>("/api/categories", signal) });
}

/** Textos de todas las categorías del catálogo en cada idioma (RNF-10). */
export function useCategoryLabelsQuery() {
  return useQuery({ queryKey: CATEGORY_LABELS_KEY, queryFn: ({ signal }) => getJson<CatalogLabelDto[]>("/api/categories/translations", signal) });
}

/** RF-49 / ADM-04: un vídeo de inspiración, como lo ve la pantalla. */
export interface InspirationVideoDto {
  id: string;
  categoryKey: string;
  locale: string;
  youtubeId: string;
  title: string;
}

/** Bajo `["categories"]`; administración la invalida al añadir o quitar un vídeo. */
export const INSPIRATION_VIDEOS_KEY = ["categories", "videos"] as const;

/** Los vídeos de la página de una categoría, en el idioma de la interfaz (o en otro, si no hay en ese). */
export function useInspirationVideos(categoryKey: string, locale: string) {
  return useQuery({
    queryKey: [...INSPIRATION_VIDEOS_KEY, categoryKey, locale],
    queryFn: ({ signal }) => getJson<InspirationVideoDto[]>(`/api/categories/videos?category=${encodeURIComponent(categoryKey)}&locale=${encodeURIComponent(locale)}`, signal),
  });
}
