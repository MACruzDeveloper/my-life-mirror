import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { ChartDataTable } from "@shared/ui/charts/ChartDataTable";
import { TimeLineChart } from "@shared/ui/charts/TimeLineChart/TimeLineChart";
import { formatDate } from "@shared/ui/charts/timeWindow";
import { useCategoryLabels } from "@modules/categories/ui/categoryLabels";
import type { ScorePoint } from "./scoreHistory";

/** Las puntuaciones van de 1 a 10: eje fijo en todas las tarjetas para que sean comparables. */
const SCORE_AXIS = { min: 1, max: 10, interval: 3 };

interface CategoryEvolutionCardProps {
  categoryName: string;
  currentScore?: number;
  /** `undefined` mientras carga el historial. */
  points?: ScorePoint[];
  historyError?: boolean;
  window: { start: Date; end: Date };
  /** Contenido extra al pie (p. ej. la recomendación de RF-18), sin que la tarjeta conozca ese módulo. */
  extra?: ReactNode;
}

/**
 * Tarjeta de una categoría en el panel (RF-14 + RF-16): puntuación actual y
 * gráfico de evolución (plantilla `TimeLineChart`), con su descripción textual
 * y la tabla "Ver datos" como alternativa accesible. La propia tarjeta muestra
 * también la carga y el error del historial, para que no se sustituya por otra
 * al terminar de cargar.
 */
export function CategoryEvolutionCard({ categoryName, currentScore, points, historyError, window, extra }: CategoryEvolutionCardProps) {
  const { t, i18n } = useTranslation();
  const displayName = useCategoryLabels().name(categoryName);
  const titleId = `evolution-${categoryName.replace(/\s+/g, "-")}`;
  const formatScoreDate = (date: Date) => formatDate(date, i18n.language);

  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper", display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
        <Typography id={titleId} variant="subtitle1" component="h3">
          {displayName}
        </Typography>
        {currentScore !== undefined && (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              {t("evolucion.actual")}
            </Typography>
            <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
              {currentScore}
            </Typography>
          </Box>
        )}
      </Box>

      {historyError ? (
        <Typography variant="body2" color="text.secondary">
          {t("evolucion.errorCarga")}
        </Typography>
      ) : points === undefined ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : points.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("evolucion.sinPuntuar")}
        </Typography>
      ) : (
        <>
          <TimeLineChart
            points={points.map((point) => ({ date: point.recordedAt, value: point.score }))}
            window={window}
            yAxis={SCORE_AXIS}
            ariaLabel={describeEvolution(displayName, points, formatScoreDate, t)}
            formatTooltip={(point) => `${point.value} · ${formatScoreDate(point.date)}`}
          />
          {points.length === 1 && (
            <Typography variant="caption" color="text.secondary" component="p">
              {t("evolucion.unaSola")}
            </Typography>
          )}
          <ChartDataTable
            caption={t("evolucion.tablaDe", { categoria: displayName })}
            headers={[t("evolucion.fecha"), t("evolucion.puntuacion")]}
            rows={points.map((point) => ({ key: String(point.recordedAt.getTime()), cells: [formatScoreDate(point.recordedAt), point.score] }))}
            showLabel={t("evolucion.verDatos")}
            hideLabel={t("evolucion.ocultarDatos")}
          />
        </>
      )}
      {extra}
    </Box>
  );
}

function describeEvolution(categoryName: string, points: ScorePoint[], formatScoreDate: (date: Date) => string, t: TFunction): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length === 1) {
    return t("evolucion.resumenUno", { categoria: categoryName, score: first.score, fecha: formatScoreDate(first.recordedAt) });
  }
  return t("evolucion.resumen", {
    categoria: categoryName,
    primera: first.score,
    fechaPrimera: formatScoreDate(first.recordedAt),
    ultima: last.score,
    fechaUltima: formatScoreDate(last.recordedAt),
    count: points.length,
  });
}
