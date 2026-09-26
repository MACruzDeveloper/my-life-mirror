import { useMemo } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEChart } from "../useEChart";
import { buildRadarChartOption, type RadarAxis } from "./radarChartOption";

export interface RadarChartProps {
  axes: RadarAxis[];
  scale: { min: number; max: number; splitNumber?: number };
  /** Descripción textual para lectores de pantalla (el gráfico en sí no lo es). */
  ariaLabel: string;
  /** Texto (HTML) del tooltip; escapar con `escapeHtml` lo que no controle el código. */
  formatTooltip: (axes: RadarAxis[]) => string;
  /** Por defecto, el color principal del tema. */
  color?: string;
  height?: number | { xs: number; sm: number };
}

/**
 * Plantilla: gráfico radar (Apache ECharts), un polígono sobre ejes con la
 * misma escala. Genérica — quien la usa decide ejes, orden, escala y textos.
 * Hermana de `TimeLineChart`, con el mismo ciclo de vida (`useEChart`).
 */
export function RadarChart({ axes, scale, ariaLabel, formatTooltip, color, height = { xs: 250, sm: 320 } }: RadarChartProps) {
  const theme = useTheme();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const chartColor = color ?? theme.palette.primary.main;

  const option = useMemo(
    () => buildRadarChartOption({ axes, scale, color: chartColor, reducedMotion, compact, formatTooltip }),
    // `scale` y `formatTooltip` suelen llegar como literales nuevos en cada render; sus valores no cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axes, scale.min, scale.max, scale.splitNumber, chartColor, reducedMotion, compact],
  );
  const containerRef = useEChart(option);

  return <Box ref={containerRef} role="img" aria-label={ariaLabel} sx={{ width: "100%", height }} />;
}
