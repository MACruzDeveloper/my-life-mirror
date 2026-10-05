import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { BandBackground } from "./BandBackground";
import { BAND_LABEL_KEYS, scoreBand } from "./scoreBand";

export interface LatestScoreDto {
  categoryId: string;
  categoryName: string;
  /** Identidad en el catálogo: la tarjeta muestra su nombre con `useCategoryLabel`. */
  catalogId?: string;
  score?: number;
  note?: string;
  recordedAt?: string;
}

/**
 * Tarjetas con la última puntuación por categoría. RN-04: el número va en el
 * color de texto normal y solo el fondo lleva un degradado muy suave por
 * band; `renderCardExtra` deja a la pantalla añadir algo bajo cada tarjeta (las
 * recomendaciones, RF-18, sin que este componente conozca ese módulo). La band también se escribe (el color nunca es la única señal).
 */
export function ScoreCards({ latestScores, renderCardExtra }: { latestScores: LatestScoreDto[]; renderCardExtra?: (categoryId: string) => ReactNode }) {
  const { t, i18n } = useTranslation();
  const { categoryLabel } = useCategoryLabel();

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
      {latestScores.map((latestScore) => {
        const band = latestScore.score !== undefined ? scoreBand(latestScore.score) : undefined;
        return (
          <Box
            key={latestScore.categoryId}
            sx={{ position: "relative", overflow: "hidden", p: 2, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }}
          >
            <BandBackground band={band} />
            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="subtitle1">{categoryLabel(latestScore.catalogId).name}</Typography>
              {band && latestScore.score !== undefined ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h4" component="span" sx={{ fontWeight: 700 }}>
                      {latestScore.score}
                    </Typography>
                    <Typography variant="body2" component="span" color="text.secondary" data-band={band}>
                      {t(BAND_LABEL_KEYS[band])}
                    </Typography>
                  </Box>
                  {latestScore.recordedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {t("resultados.ultima", { fecha: new Date(latestScore.recordedAt).toLocaleDateString(i18n.language) })}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("resultados.sinPuntuar")}
                </Typography>
              )}
              {renderCardExtra?.(latestScore.categoryId)}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
