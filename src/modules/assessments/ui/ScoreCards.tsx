import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { BandBackground } from "./BandBackground";
import { scoreBand, type ScoreBand } from "./scoreBand";

export interface LatestScoreDto {
  categoryId: string;
  categoryName: string;
  score?: number;
  note?: string;
  recordedAt?: string;
}

const BAND_KEYS: Record<ScoreBand, string> = {
  low: "resultados.bandaLow",
  mediumLow: "resultados.bandaMediumLow",
  medium: "resultados.bandaMedium",
  high: "resultados.bandaHigh",
};

/**
 * Tarjetas con la última puntuación por categoría. RN-04: el número va en el
 * color de texto normal y solo el fondo lleva un degradado muy suave por
 * banda; la banda también se escribe (el color nunca es la única señal).
 */
export function ScoreCards({ resultados }: { resultados: LatestScoreDto[] }) {
  const { t, i18n } = useTranslation();

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
      {resultados.map((resultado) => {
        const banda = resultado.score !== undefined ? scoreBand(resultado.score) : undefined;
        return (
          <Box
            key={resultado.categoryId}
            sx={{ position: "relative", overflow: "hidden", p: 2, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }}
          >
            <BandBackground band={banda} />
            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="subtitle1">{resultado.categoryName}</Typography>
              {banda && resultado.score !== undefined ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h4" component="span" sx={{ fontWeight: 700 }}>
                      {resultado.score}
                    </Typography>
                    <Typography variant="body2" component="span" color="text.secondary" data-band={banda}>
                      {t(BAND_KEYS[banda])}
                    </Typography>
                  </Box>
                  {resultado.note && <Typography variant="body2">{resultado.note}</Typography>}
                  {resultado.recordedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {t("resultados.ultima", { fecha: new Date(resultado.recordedAt).toLocaleDateString(i18n.language) })}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("resultados.sinPuntuar")}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
