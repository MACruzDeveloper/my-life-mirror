export type ScoreBand = "low" | "mediumLow" | "medium" | "high";

/**
 * Franjas de color de las puntuaciones (1-10). Colores suaves, no de
 * alarma (RN-04: el sistema aconseja, no juzga) y siempre acompañados del
 * número — el color nunca es lo único que informa (accesibilidad).
 * Rojo suave = bajo, naranja = casi bajo, ámbar = medio, verde = bueno.
 */
export function scoreBand(score: number): ScoreBand {
  if (score <= 3) return "low";
  if (score <= 5) return "mediumLow";
  if (score <= 7) return "medium";
  return "high";
}

export const BAND_COLORS: Record<ScoreBand, { bg: string; fg: string; border: string }> = {
  low: { bg: "#FDECEA", fg: "#B3261E", border: "#F2B8B5" },
  mediumLow: { bg: "#FFF1E0", fg: "#A85300", border: "#FFD2A1" },
  medium: { bg: "#FFF8DB", fg: "#7A5C00", border: "#F5E29A" },
  high: { bg: "#E6F4EA", fg: "#1E6B34", border: "#A8D5B5" },
};
