import { useMemo } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEChart } from "../useEChart";
import { CHART_ACCENT } from "@shared/ui/theme";
import { barChartHeight, buildBarChartOption, type Bar } from "./barChartOption";

export interface BarChartProps {
  bars: Bar[];
  scale: { min: number; max: number; splitNumber?: number };
  /** Descripción textual para lectores de pantalla (el gráfico en sí no lo es). */
  ariaLabel: string;
  /** Texto (HTML) del tooltip; escapar con `escapeHtml` lo que no controle el código. */
  formatTooltip: (bar: Bar) => string;
  /** Por defecto, el color de los gráficos de la app (`CHART_ACCENT`). */
  color?: string;
}

/**
 * Plantilla: barras horizontales (Apache ECharts) en una escala común. Genérica:
 * quien la usa decide barras, orden, escala y textos. Hermana de `RadarChart` y
 * `TimeLineChart`, con el mismo ciclo de vida (`useEChart`); la altura crece con
 * el número de barras.
 */
export function BarChart({ bars, scale, ariaLabel, formatTooltip, color }: BarChartProps) {
  const theme = useTheme();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const chartColor = color ?? CHART_ACCENT;

  const option = useMemo(
    () => buildBarChartOption({ bars, scale, color: chartColor, reducedMotion, compact, formatTooltip }),
    // `scale` y `formatTooltip` suelen llegar como literales nuevos en cada render; sus valores no cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bars, scale.min, scale.max, scale.splitNumber, chartColor, reducedMotion, compact],
  );
  const containerRef = useEChart(option);

  return <Box ref={containerRef} role="img" aria-label={ariaLabel} sx={{ width: "100%", height: barChartHeight(bars.length) }} />;
}
