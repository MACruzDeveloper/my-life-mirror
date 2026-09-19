import Box from "@mui/material/Box";
import { BAND_GRADIENTS, BANDS, type ScoreBand } from "./scoreBand";

/**
 * Capa de fondo con degradado suave por banda de puntuación. Un
 * `background-image` no se puede animar con CSS, así que hay una capa por
 * banda y se hace fundido cruzado con `opacity` (y ninguna si no hay banda:
 * transparente). Se respeta `prefers-reduced-motion`.
 */
export function BandBackground({ band }: { band?: ScoreBand }) {
  return (
    <>
      {BANDS.map((candidata) => (
        <Box
          key={candidata}
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: BAND_GRADIENTS[candidata],
            opacity: band === candidata ? 1 : 0,
            transition: "opacity 600ms ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
