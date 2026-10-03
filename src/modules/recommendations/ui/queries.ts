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
  return useQuery({ queryKey: RECOMMENDATIONS_KEY, queryFn: () => getJson<RecommendationDto[]>("/api/recommendations") });
}

export type PersonalizedIdeaDto = { source: "ai"; templateKey: string; text: string } | { source: "catalog"; templateKey: string };

/**
 * RF-40. Fuera de `["assessments"]` a propósito: guardar puntuaciones no debe
 * volver a pedirla (el servidor ya la guarda). Se invalida al desactivar la función.
 */
export const PERSONALIZED_IDEAS_KEY = ["personalized-ideas"] as const;

export function usePersonalizedIdea(recommendationId: string, locale: string, enabled: boolean) {
  return useQuery({
    queryKey: [...PERSONALIZED_IDEAS_KEY, recommendationId, locale],
    enabled,
    queryFn: async () => {
      const response = await fetch("/api/recommendations/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, locale }),
      });
      if (!response.ok) throw new Error("personalize failed");
      return (await response.json()) as PersonalizedIdeaDto;
    },
  });
}
