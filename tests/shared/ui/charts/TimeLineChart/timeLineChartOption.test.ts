import { describe, expect, it } from "vitest";
import { buildTimeLineChartOption } from "@shared/ui/charts/TimeLineChart/timeLineChartOption";

const points = [
  { date: new Date("2026-01-15T10:00:00"), value: 3 },
  { date: new Date("2026-09-18T10:00:00"), value: 7 },
];
const window = { start: new Date("2026-01-01T00:00:00"), end: new Date("2026-10-01T00:00:00") };
const base = { points, window, yAxis: { min: 1, max: 10, interval: 3 }, locale: "es", color: "#1976d2", reducedMotion: false, formatTooltip: (p: { value: number }) => `valor ${p.value}` };

describe("buildTimeLineChartOption (plantilla de gráfico de líneas temporal)", () => {
  const option = buildTimeLineChartOption(base);

  it("eje de tiempo con los límites de la ventana, marcas mensuales y sin etiqueta en el límite final (exclusivo)", () => {
    const x = option.xAxis as { type: string; min: number; max: number; minInterval: number; axisLabel: { showMaxLabel: boolean } };
    expect(x.type).toBe("time");
    expect([x.min, x.max]).toEqual([window.start.getTime(), window.end.getTime()]);
    expect(x.minInterval).toBeGreaterThanOrEqual(28 * 24 * 3600 * 1000);
    expect(x.axisLabel.showMaxLabel).toBe(false);
  });

  it("el eje vertical lo decide quien usa la plantilla", () => {
    const y = option.yAxis as { min: number; max: number; interval: number };
    expect([y.min, y.max, y.interval]).toEqual([1, 10, 3]);
  });

  it("una serie de línea con los puntos, recortada a la ventana y en el color recibido", () => {
    const [series] = option.series as { type: string; data: [number, number][]; clip: boolean; lineStyle: { color: string } }[];
    expect(series.type).toBe("line");
    expect(series.data).toEqual([
      [points[0].date.getTime(), 3],
      [points[1].date.getTime(), 7],
    ]);
    expect(series.clip).toBe(true);
    expect(series.lineStyle.color).toBe("#1976d2");
  });

  it("el tooltip usa el formateador recibido", () => {
    const tooltip = option.tooltip as { formatter: (p: unknown) => string };
    expect(tooltip.formatter([{ value: [points[1].date.getTime(), 7] }])).toBe("valor 7");
  });

  it("sin animación si el usuario prefiere menos movimiento", () => {
    expect(buildTimeLineChartOption({ ...base, reducedMotion: true }).animation).toBe(false);
  });
});
