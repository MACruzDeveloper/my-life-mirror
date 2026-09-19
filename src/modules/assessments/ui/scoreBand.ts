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

/**
 * Degradado de fondo muy suave por banda (RN-04: el sistema no juzga). Va de
 * transparente a un tono apenas perceptible; el número nunca se colorea.
 */
export const BAND_GRADIENTS: Record<ScoreBand, string> = {
  low: "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(239,154,154,0.28) 100%)",
  mediumLow: "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,183,110,0.28) 100%)",
  medium: "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(245,220,120,0.30) 100%)",
  high: "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(129,199,150,0.30) 100%)",
};

export const BANDS: ScoreBand[] = ["low", "mediumLow", "medium", "high"];
