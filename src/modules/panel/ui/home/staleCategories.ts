const DAY_MS = 24 * 60 * 60 * 1000;
/** A partir de cuántos días sin actualizar una categoría se invita a mirarla. */
const STALE_AFTER_DAYS = 30;
const MAX_SHOWN = 3;

export interface ScoredCategory {
  categoryId: string;
  categoryName: string;
  score?: number;
  recordedAt?: string;
}

export interface StaleCategory {
  categoryId: string;
  categoryName: string;
  weeks: number;
}

/** Las categorías puntuadas hace más de 30 días: la más antigua primero, tres como mucho. */
export function staleCategories(latestScores: readonly ScoredCategory[], now: Date): StaleCategory[] {
  return latestScores
    .filter((latest) => latest.score !== undefined && latest.recordedAt !== undefined)
    .map((latest) => ({ categoryId: latest.categoryId, categoryName: latest.categoryName, days: Math.floor((now.getTime() - new Date(latest.recordedAt!).getTime()) / DAY_MS) }))
    .filter((latest) => latest.days > STALE_AFTER_DAYS)
    .sort((a, b) => b.days - a.days)
    .slice(0, MAX_SHOWN)
    .map(({ days, ...rest }) => ({ ...rest, weeks: Math.floor(days / 7) }));
}
