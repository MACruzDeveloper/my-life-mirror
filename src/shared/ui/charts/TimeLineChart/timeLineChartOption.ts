import { monthLabel } from "../timeWindow";

export interface TimePoint {
  date: Date;
  value: number;
}

export interface TimeLineChartOptionInput {
  points: TimePoint[];
  window: { start: Date; end: Date };
  yAxis: { min: number; max: number; interval?: number };
  locale: string;
  color: string;
  reducedMotion: boolean;
  formatTooltip: (point: TimePoint) => string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SECONDARY_INK = "#72828C";
const GRID_LINE = "#DCDFE1";

/**
 * Opción de ECharts de la plantilla `TimeLineChart`: una sola serie de línea
 * sobre un eje de tiempo con marcas mensuales. Todo lo específico (eje
 * vertical, color, texto del tooltip) lo decide quien usa la plantilla.
 * `clip`: si un punto queda fuera de la ventana, la línea se corta en el borde
 * en vez de desaparecer, así se ve de dónde venía.
 */
export function buildTimeLineChartOption({ points, window, yAxis, locale, color, reducedMotion, formatTooltip }: TimeLineChartOptionInput) {
  const months = (window.end.getTime() - window.start.getTime()) / (30 * DAY_MS);

  return {
    animation: !reducedMotion,
    aria: { enabled: false }, // la descripción textual la pone el componente
    grid: { left: 28, right: 16, top: 12, bottom: 36 },
    xAxis: {
      type: "time",
      min: window.start.getTime(),
      max: window.end.getTime(),
      minInterval: 28 * DAY_MS,
      // Hasta un año, una marca por mes; con más, ECharts las espacia sola.
      ...(months <= 13 ? { maxInterval: 31 * DAY_MS } : {}),
      axisLabel: {
        formatter: (timestamp: number, index: number) => monthLabel(timestamp, locale, index === 0),
        hideOverlap: true,
        // El límite final es exclusivo (el mes siguiente al último mostrado): no se etiqueta.
        showMaxLabel: false,
        color: SECONDARY_INK,
        fontSize: 10,
      },
      axisLine: { lineStyle: { color: "#BFBFBF" } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: yAxis.min,
      max: yAxis.max,
      ...(yAxis.interval ? { interval: yAxis.interval } : {}),
      axisLabel: { color: SECONDARY_INK, fontSize: 10 },
      splitLine: { lineStyle: { color: GRID_LINE } },
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", lineStyle: { color: "#8E9BA3" } },
      formatter: (params: unknown) => {
        const [first] = params as { value: [number, number] }[];
        const [timestamp, value] = first.value;
        return formatTooltip({ date: new Date(timestamp), value });
      },
    },
    series: [
      {
        type: "line",
        data: points.map((point) => [point.date.getTime(), point.value] as [number, number]),
        clip: true,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 2, color },
        // Anillo del color de fondo alrededor de cada punto para separarlo de la línea.
        itemStyle: { color, borderColor: "#FFFFFF", borderWidth: 2 },
        emphasis: { scale: 1.4 },
      },
    ],
  };
}
