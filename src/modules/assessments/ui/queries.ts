import { useQuery } from "@tanstack/react-query";
import { getJson } from "@shared/ui/api/getJson";
import type { LatestScoreDto } from "./ScoreCards";

export interface HistoryEntryDto {
  categoryId: string;
  categoryName: string;
  /** Identidad en el catálogo: se muestra con `useCategoryLabel`. */
  catalogId?: string;
  score: number;
  previousScore?: number;
  note?: string;
}

export interface HistorySessionDto {
  recordedAt: string;
  entries: HistoryEntryDto[];
}

export const ASSESSMENTS_KEY = ["assessments"] as const;
export const LATEST_SCORES_KEY = ["assessments", "latest"] as const;
export const HISTORY_KEY = ["assessments", "history"] as const;

/** Última puntuación por categoría activa (Entrevista, Resultados e Inicio comparten esta caché). */
export function useLatestScores() {
  return useQuery({ queryKey: LATEST_SCORES_KEY, queryFn: ({ signal }) => getJson<LatestScoreDto[]>("/api/assessments", signal) });
}

export function useAssessmentHistory() {
  return useQuery({ queryKey: HISTORY_KEY, queryFn: ({ signal }) => getJson<HistorySessionDto[]>("/api/assessments/history", signal) });
}
