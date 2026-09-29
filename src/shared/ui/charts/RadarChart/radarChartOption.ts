export interface RadarAxis {
  name: string;
  value: number;
}

export interface RadarChartOptionInput {
  /** Un eje por elemento, en este orden (quien llama decide un orden estable). */
  axes: RadarAxis[];
  /** Misma escala para todos los ejes. */
  scale: { min: number; max: number; splitNumber?: number };
  color: string;
  reducedMotion: boolean;
  /** Pantallas estrechas: radar más pequeño para que quepan los nombres largos de los ejes. */
  compact?: boolean;
  /** Texto (HTML) del tooltip; debe escapar cualquier texto no controlado (`escapeHtml`). */
  formatTooltip: (axes: RadarAxis[]) => string;
}

const SECONDARY_INK = "#6B7672";
const GRID_LINE = "#E4E8E6";

/**
 * Opción de ECharts de la plantilla `RadarChart`: un único polígono sobre ejes
 * con la misma escala, relleno suave del color recibido.
 */
export function buildRadarChartOption({ axes, scale, color, reducedMotion, compact = false, formatTooltip }: RadarChartOptionInput) {
  return {
    animation: !reducedMotion,
    aria: { enabled: false }, // la descripción textual la pone el componente
    tooltip: { trigger: "item", confine: true, formatter: () => formatTooltip(axes) },
    radar: {
      indicator: axes.map((axis) => ({ name: axis.name, min: scale.min, max: scale.max })),
      splitNumber: scale.splitNumber ?? 5,
      radius: compact ? "46%" : "62%",
      center: ["50%", "54%"],
      axisName: { color: SECONDARY_INK, fontSize: compact ? 10 : 11 },
      axisLine: { lineStyle: { color: GRID_LINE } },
      splitLine: { lineStyle: { color: GRID_LINE } },
      splitArea: { show: false },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 6,
        data: [{ value: axes.map((axis) => axis.value) }],
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: { color, opacity: 0.18 },
      },
    ],
  };
}
