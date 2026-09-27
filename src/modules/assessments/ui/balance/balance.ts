import type { RadarAxis } from "@shared/ui/charts/RadarChart/radarChartOption";
import type { LatestScoreDto } from "../ScoreCards";

/** Con menos de tres ejes no hay polígono que leer. */
export const MIN_SCORED_CATEGORIES = 3;

export interface Balance {
  /** Categorías puntuadas, en el orden recibido (el del catálogo): nunca ordenadas por puntuación. */
  axes: RadarAxis[];
  /** Activas pero todavía sin puntuar: fuera del radar. */
  unscoredNames: string[];
  hasEnoughData: boolean;
}

/**
 * RF-15. Qué entra en el radar de equilibrio. El orden de los ejes se mantiene
 * fijo porque en un radar la forma depende del orden: si se ordenara por
 * puntuación, la forma cambiaría sin que cambiaran los datos.
 */
export function buildBalance(latestScores: LatestScoreDto[]): Balance {
  const axes: RadarAxis[] = [];
  const unscoredNames: string[] = [];
  for (const latestScore of latestScores) {
    if (latestScore.score === undefined) unscoredNames.push(latestScore.categoryName);
    else axes.push({ name: latestScore.categoryName, value: latestScore.score });
  }
  return { axes, unscoredNames, hasEnoughData: axes.length >= MIN_SCORED_CATEGORIES };
}
