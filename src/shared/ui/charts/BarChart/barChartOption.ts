import { PALETTE, TEXT_SECONDARY } from "../../theme";

export interface Bar {
  name: string;
  value: number;
}

export interface BarChartOptionInput {
  /** Una barra por elemento, de arriba abajo en este orden (quien llama decide un orden estable). */
  bars: Bar[];
  /** Misma escala para todas las barras. */
  scale: { min: number; max: number; splitNumber?: number };
  color: string;
  reducedMotion: boolean;
  /** Pantallas estrechas: nombres más pequeños, para que quepan los largos. */
  compact?: boolean;
  /** Texto (HTML) del tooltip; debe escapar cualquier texto no controlado (`escapeHtml`). */
  formatTooltip: (bar: Bar) => string;
}

const SECONDARY_INK = TEXT_SECONDARY;
const GRID_LINE = "#DCDFE1";
const ROW_HEIGHT = 40;

/** Altura del gráfico: una fila por barra, más el eje; con un mínimo para que una sola no quede aplastada. */
export function barChartHeight(barCount: number) {
  return Math.max(100, barCount * ROW_HEIGHT + 36);
}

/**
 * Opción de ECharts de la plantilla `BarChart`: barras horizontales de una sola
 * serie y un solo color, finas y con el extremo redondeado, el valor escrito al
 * final y guías verticales suaves.
 */
export function buildBarChartOption({ bars, scale, color, reducedMotion, compact = false, formatTooltip }: BarChartOptionInput) {
  return {
    animation: !reducedMotion,
    aria: { enabled: false }, // la descripción textual la pone el componente
    grid: { left: 8, right: 32, top: 4, bottom: 4, containLabel: true },
    // Por fila, no por barra: la barra es fina y la fila entera es más fácil de señalar.
    tooltip: {
      trigger: "axis",
      // Sombreado de la fila: el color de la barra al 8 % (espera un hex #RRGGBB).
      axisPointer: { type: "shadow", shadowStyle: { color: `${color}14` } },
      confine: true,
      formatter: (params: { dataIndex: number } | { dataIndex: number }[]) => formatTooltip(bars[(Array.isArray(params) ? params[0] : params).dataIndex]),
    },
    xAxis: {
      type: "value",
      min: scale.min,
      max: scale.max,
      splitNumber: scale.splitNumber ?? 5,
      axisLabel: { color: SECONDARY_INK, fontSize: 11 },
      splitLine: { lineStyle: { color: GRID_LINE } },
    },
    yAxis: {
      type: "category",
      data: bars.map((bar) => bar.name),
      // La primera, arriba (ECharts empieza por abajo).
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID_LINE } },
      axisLabel: { color: PALETTE.midnight, fontSize: compact ? 11 : 13, fontWeight: 600, width: compact ? 90 : 160, overflow: "break" },
    },
    series: [
      {
        type: "bar",
        data: bars.map((bar) => bar.value),
        barWidth: 14,
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { color, opacity: 0.85 } },
        label: { show: true, position: "right", color: PALETTE.midnight, fontWeight: 700, fontSize: 13 },
      },
    ],
  };
}
