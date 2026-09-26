import { describe, expect, it } from "vitest";
import { buildRadarChartOption } from "@shared/ui/charts/RadarChart/radarChartOption";

const axes = [
  { name: "Economía", value: 7 },
  { name: "Deporte", value: 3 },
  { name: "Familia", value: 9 },
];
const base = { axes, scale: { min: 0, max: 10, splitNumber: 5 }, color: "#1976d2", reducedMotion: false, formatTooltip: (items: { name: string; value: number }[]) => items.map((i) => `${i.name}=${i.value}`).join(";") };

describe("buildRadarChartOption (plantilla de radar)", () => {
  const option = buildRadarChartOption(base);

  it("un eje por elemento, en el orden recibido, todos con la misma escala", () => {
    const radar = option.radar as { indicator: { name: string; min: number; max: number }[]; splitNumber: number };
    expect(radar.indicator.map((i) => i.name)).toEqual(["Economía", "Deporte", "Familia"]);
    expect(radar.indicator.every((i) => i.min === 0 && i.max === 10)).toBe(true);
    expect(radar.splitNumber).toBe(5);
  });

  it("un único polígono con los valores en el mismo orden, relleno suave del color recibido", () => {
    const [series] = option.series as { type: string; data: { value: number[] }[]; areaStyle: { color: string; opacity: number }; lineStyle: { color: string } }[];
    expect(series.type).toBe("radar");
    expect(series.data).toHaveLength(1);
    expect(series.data[0].value).toEqual([7, 3, 9]);
    expect(series.lineStyle.color).toBe("#1976d2");
    expect(series.areaStyle.opacity).toBeLessThanOrEqual(0.25);
  });

  it("el tooltip recibe cada eje con su valor", () => {
    const tooltip = option.tooltip as { formatter: () => string };
    expect(tooltip.formatter()).toBe("Economía=7;Deporte=3;Familia=9");
  });

  it("sin animación si el usuario prefiere menos movimiento", () => {
    expect(buildRadarChartOption({ ...base, reducedMotion: true }).animation).toBe(false);
  });

  it("en modo compacto (móvil) el radar es más pequeño y las etiquetas más cortas de fuente, para que quepan los nombres largos", () => {
    const normal = buildRadarChartOption(base).radar as { radius: string; axisName: { fontSize: number } };
    const compact = buildRadarChartOption({ ...base, compact: true }).radar as { radius: string; axisName: { fontSize: number } };
    expect(parseFloat(compact.radius)).toBeLessThan(parseFloat(normal.radius));
    expect(compact.axisName.fontSize).toBeLessThan(normal.axisName.fontSize);
  });
});

