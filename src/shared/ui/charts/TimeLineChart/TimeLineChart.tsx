import { useMemo } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
import { useEChart } from "../useEChart";
import { CHART_ACCENT } from "@shared/ui/theme";
import { buildTimeLineChartOption, type TimePoint } from "./timeLineChartOption";

export interface TimeLineChartProps {
  points: TimePoint[];
  /** Periodo mostrado; varios gráficos con la misma ventana son comparables. */
  window: { start: Date; end: Date };
  yAxis: { min: number; max: number; interval?: number };
  /** Descripción textual para lectores de pantalla (el gráfico en sí no lo es). */
  ariaLabel: string;
  formatTooltip: (point: TimePoint) => string;
  /** Por defecto, el color de los gráficos de la app (`CHART_ACCENT`). */
  color?: string;
  height?: number | { xs: number; sm: number };
}

/**
 * Plantilla: gráfico de líneas sobre el tiempo (Apache ECharts), con marcas
 * mensuales. Genérica — no sabe nada de categorías ni puntuaciones; quien la
 * usa decide los datos, el eje vertical, el texto del tooltip y la descripción.
 * Respeta `prefers-reduced-motion`.
 */
export function TimeLineChart({ points, window, yAxis, ariaLabel, formatTooltip, color, height = { xs: 170, sm: 190 } }: TimeLineChartProps) {
  const { i18n } = useTranslation();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const lineColor = color ?? CHART_ACCENT;
  const start = window.start.getTime();
  const end = window.end.getTime();

  const option = useMemo(
    () =>
      buildTimeLineChartOption({
        points,
        window: { start: new Date(start), end: new Date(end) },
        yAxis,
        locale: i18n.language,
        color: lineColor,
        reducedMotion,
        formatTooltip,
      }),
    // `yAxis` y `formatTooltip` suelen llegar como literales nuevos en cada render; sus valores no cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, start, end, yAxis.min, yAxis.max, yAxis.interval, i18n.language, lineColor, reducedMotion],
  );
  const containerRef = useEChart(option);

  return <Box ref={containerRef} role="img" aria-label={ariaLabel} sx={{ width: "100%", height }} />;
}
