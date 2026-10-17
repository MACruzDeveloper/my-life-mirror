import { useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { periodWindow, type Period } from "@shared/ui/charts/timeWindow";
import type { HistorySessionDto } from "../queries";
import type { LatestScoreDto } from "../queries";
import { CategoryEvolutionCard } from "./CategoryEvolutionCard";
import { PeriodSelector } from "./PeriodSelector";
import { buildCategoryTimeSeries } from "./scoreHistory";

interface EvolutionPanelProps {
  /** Categorías activas con su última puntuación (RF-14): deciden qué tarjetas hay y en qué orden. */
  latestScores: LatestScoreDto[];
  /** Historial de guardados; `undefined` mientras carga. */
  sessions?: HistorySessionDto[];
  historyError?: boolean;
  /** Contenido extra al pie de cada tarjeta (la recomendación de RF-18). */
  renderCardExtra?: (categoryId: string) => ReactNode;
}

/**
 * Evolución de todas las categorías (RF-16): selector de periodo común y una
 * tarjeta por categoría activa, en dos columnas desde tablet. Todas las
 * tarjetas muestran siempre los mismos meses. Se eligió un selector común en
 * vez de desplazamiento horizontal dentro de cada gráfico porque en móvil ese
 * gesto compite con el desplazamiento de la página y cada tarjeta podría
 * quedar en un periodo distinto. En móvil, 6 meses por defecto (las etiquetas
 * de mes caben mejor); en pantallas mayores, 12.
 */
export function EvolutionPanel({ latestScores, sessions, historyError, renderCardExtra }: EvolutionPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const [period, setPeriod] = useState<Period>(isMobile ? "6m" : "12m");
  const [periodOffset, setPeriodOffset] = useState(0);

  const seriesByCategory = useMemo(() => buildCategoryTimeSeries(sessions ?? [], latestScores), [sessions, latestScores]);
  const timestamps = seriesByCategory.flatMap((series) => series.points.map((point) => point.recordedAt.getTime()));
  const now = new Date();
  const window = periodWindow(
    period,
    periodOffset,
    timestamps.length > 0 ? new Date(Math.min(...timestamps)) : now,
    timestamps.length > 0 ? new Date(Math.max(...timestamps)) : now,
    now,
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PeriodSelector
        period={period}
        window={window}
        onPeriodChange={(newPeriod) => {
          setPeriod(newPeriod);
          setPeriodOffset(0);
        }}
        onPrevious={() => setPeriodOffset((offset) => offset - 1)}
        onNext={() => setPeriodOffset((offset) => offset + 1)}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
        {latestScores.map((latestScore, index) => (
          <CategoryEvolutionCard
            key={latestScore.categoryId}
            categoryName={latestScore.categoryName}
            currentScore={latestScore.score}
            points={sessions === undefined ? undefined : seriesByCategory[index].points}
            historyError={historyError}
            window={window}
            extra={renderCardExtra?.(latestScore.categoryId)}
          />
        ))}
      </Box>
    </Box>
  );
}
