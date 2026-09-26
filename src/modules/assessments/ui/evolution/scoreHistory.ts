import type { HistorySessionDto } from "../queries";

export interface ScorePoint {
  score: number;
  recordedAt: Date;
}

export interface CategoryTimeSeries {
  categoryId: string;
  categoryName: string;
  /** De la más antigua a la más reciente. */
  points: ScorePoint[];
}

/**
 * RF-16. Pasa del historial por guardados (`GET /api/assessments/history`, el
 * mismo que usa el historial de cambios de la entrevista) a una serie por
 * categoría activa, lista para dibujar. Se hace en la pantalla para no gastar
 * una función serverless más en otra forma de los mismos datos. Las
 * categorías inactivas se ignoran (sus datos se conservan en el servidor).
 */
export function buildCategoryTimeSeries(
  sessions: HistorySessionDto[],
  activeCategories: { categoryId: string; categoryName: string }[],
): CategoryTimeSeries[] {
  const pointsByCategory = new Map<string, ScorePoint[]>(activeCategories.map((category) => [category.categoryId, []]));

  for (const session of sessions) {
    const recordedAt = new Date(session.recordedAt);
    for (const entry of session.entries) {
      pointsByCategory.get(entry.categoryId)?.push({ score: entry.score, recordedAt });
    }
  }

  return activeCategories.map((category) => ({
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    points: (pointsByCategory.get(category.categoryId) ?? []).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()),
  }));
}
