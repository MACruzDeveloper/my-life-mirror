import { useEffect, useRef } from "react";
import { echarts } from "./echarts";

type EChartsOption = Parameters<ReturnType<typeof echarts.init>["setOption"]>[0];

/**
 * Ciclo de vida de un gráfico de ECharts, común a todas las plantillas: lo crea
 * una sola vez sobre el contenedor devuelto, se redimensiona con él, aplica
 * `option` cada vez que cambia (el llamador la memoriza) y lo libera al
 * desmontar.
 */
export function useEChart(option: EChartsOption) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container, undefined, { renderer: "svg" });
    chartRef.current = chart;
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => chart.resize());
    resizeObserver?.observe(container);
    return () => {
      resizeObserver?.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return containerRef;
}
