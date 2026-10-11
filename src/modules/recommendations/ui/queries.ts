import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";

export interface RecommendationDto {
  id: string;
  categoryId: string;
  categoryName: string;
  /** Identidad en el catálogo: se muestra con `useCategoryLabel`. */
  catalogId?: string;
  templateKey: string;
  status: string;
}

/**
 * Bajo `["assessments", …]` a propósito: guardar puntuaciones o activar/desactivar
 * categorías ya invalidan `["assessments"]` (ver InterviewPage), y las
 * recomendaciones dependen de ambas cosas, así que se refrescan solas.
 */
export const RECOMMENDATIONS_KEY = ["assessments", "recommendations"] as const;

export function useRecommendations() {
  return useQuery({ queryKey: RECOMMENDATIONS_KEY, queryFn: ({ signal }) => getJson<RecommendationDto[]>("/api/recommendations", signal) });
}

/** `notice: "limit"`: se ve la idea original porque se agotó el tope diario de IA (RF-40b). */
export type PersonalizedIdeaDto = { source: "ai"; templateKey: string; text: string } | { source: "catalog"; templateKey: string; notice?: "limit" };

/**
 * RF-40. Fuera de `["assessments"]` a propósito: guardar puntuaciones no debe
 * volver a pedirla (el servidor ya la guarda). Se invalida al desactivar la función.
 */
export const PERSONALIZED_IDEAS_KEY = ["personalized-ideas"] as const;

/**
 * Una idea del carrusel (UX-05), personalizada si procede. `experienceTags` va
 * en la clave: si cambian las opciones de "¿Qué te ayuda?" de la categoría, se
 * pide de nuevo y el servidor la reescribe (RF-40 v1.1).
 */
export function usePersonalizedIdea(recommendationId: string, templateKey: string, locale: string, experienceTags: readonly string[], enabled: boolean) {
  return useQuery({
    queryKey: [...PERSONALIZED_IDEAS_KEY, recommendationId, templateKey, locale, [...experienceTags].sort().join("|")],
    enabled,
    // Con la señal de la carga: si se cancela (p. ej. al cambiar "¿Qué te ayuda?"), la petición se aborta.
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/recommendations/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, templateKey, locale }),
        signal,
      });
      if (!response.ok) throw new Error("personalize failed");
      return (await response.json()) as PersonalizedIdeaDto;
    },
  });
}
