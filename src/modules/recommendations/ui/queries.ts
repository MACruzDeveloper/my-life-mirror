import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";

export interface RecommendationDto {
  id: string;
  categoryId: string;
  categoryName: string;
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
