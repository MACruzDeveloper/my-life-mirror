import { describe, expect, it } from "vitest";
import { barChartHeight, buildBarChartOption } from "@shared/ui/charts/BarChart/barChartOption";

const bars = [
  { name: "Economía", value: 9 },
  { name: "Familia", value: 4 },
];
const base = { bars, scale: { min: 0, max: 10, splitNumber: 5 }, color: "#5F929C", reducedMotion: false, formatTooltip: (bar: { name: string; value: number }) => `${bar.name}=${bar.value}` };

describe("buildBarChartOption (plantilla de barras horizontales)", () => {
  const option = buildBarChartOption(base);

  it("una barra por elemento, en el orden recibido de arriba abajo, en una escala común", () => {
    const yAxis = option.yAxis as { type: string; data: string[]; inverse: boolean };
    const xAxis = option.xAxis as { type: string; min: number; max: number; splitNumber: number };
    expect(yAxis.type).toBe("category");
    expect(yAxis.data).toEqual(["Economía", "Familia"]);
    expect(yAxis.inverse).toBe(true);
    expect(xAxis).toMatchObject({ type: "value", min: 0, max: 10, splitNumber: 5 });
  });

  it("una sola serie, de un solo color, con el extremo redondeado y el valor escrito al final", () => {
    const [series] = option.series as { type: string; data: number[]; itemStyle: { color: string; borderRadius: number[] }; label: { show: boolean; position: string } }[];
    expect(series.type).toBe("bar");
    expect(series.data).toEqual([9, 4]);
    expect(series.itemStyle.color).toBe("#5F929C");
    expect(series.itemStyle.borderRadius).toEqual([0, 4, 4, 0]);
    expect(series.label).toMatchObject({ show: true, position: "right" });
  });

  it("el tooltip salta con toda la fila y recibe su barra", () => {
    const tooltip = option.tooltip as { trigger: string; formatter: (params: { dataIndex: number }[]) => string };
    expect(tooltip.trigger).toBe("axis");
    expect(tooltip.formatter([{ dataIndex: 1 }])).toBe("Familia=4");
  });

  it("sin animación si se pide menos movimiento", () => {
    expect(buildBarChartOption({ ...base, reducedMotion: true }).animation).toBe(false);
  });

  it("la altura crece con el número de barras, con un mínimo", () => {
    expect(barChartHeight(1)).toBeLessThan(barChartHeight(8));
    expect(barChartHeight(1)).toBeGreaterThanOrEqual(100);
  });
});
