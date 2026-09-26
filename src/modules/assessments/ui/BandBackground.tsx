import Box from "@mui/material/Box";
import { BAND_COLORS, type ScoreBand } from "./scoreBand";

/**
 * Capa de fondo de color plano y suave según la banda de puntuación
 * (transparente si no hay banda). Plano a propósito, sin degradados: más
 * limpio y moderno. El cambio de color se anima con `background-color`
 * (sí es animable, a diferencia de un degradado) y se respeta
 * `prefers-reduced-motion`. El número nunca se colorea (RN-04).
 */
export function BandBackground({ band }: { band?: ScoreBand }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: band ? BAND_COLORS[band].bg : "transparent",
        transition: "background-color 400ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        pointerEvents: "none",
      }}
    />
  );
}
