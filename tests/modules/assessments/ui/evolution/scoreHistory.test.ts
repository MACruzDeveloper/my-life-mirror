import { describe, expect, it } from "vitest";
import { buildCategoryTimeSeries } from "@modules/assessments/ui/evolution/scoreHistory";

const SESIONES = [
  // El endpoint las devuelve de la más reciente a la más antigua.
  { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 7, previousScore: 4 }] },
  {
    recordedAt: "2026-05-02T10:00:00.000Z",
    entries: [
      { categoryId: "c1", categoryName: "Economía", score: 4, previousScore: 3 },
      { categoryId: "cX", categoryName: "Pareja", score: 9 },
    ],
  },
  { recordedAt: "2026-01-15T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 3 }, { categoryId: "c2", categoryName: "Deporte", score: 5 }] },
];

const ACTIVAS = [
  { categoryId: "c2", categoryName: "Deporte" },
  { categoryId: "c1", categoryName: "Economía" },
  { categoryId: "c3", categoryName: "Familia" },
];

describe("buildCategoryTimeSeries (RF-16)", () => {
  it("devuelve una serie por categoría activa, en el orden recibido, con sus puntos de la más antigua a la más reciente", () => {
    const series = buildCategoryTimeSeries(SESIONES, ACTIVAS);

    expect(series.map((s) => s.categoryId)).toEqual(["c2", "c1", "c3"]);
    const economia = series[1];
    expect(economia.categoryName).toBe("Economía");
    expect(economia.points.map((p) => p.score)).toEqual([3, 4, 7]);
    expect(economia.points[0].recordedAt).toEqual(new Date("2026-01-15T10:00:00.000Z"));
    expect(economia.points[2].recordedAt).toEqual(new Date("2026-09-18T10:00:00.000Z"));
  });

  it("una categoría activa sin historial tiene la serie vacía", () => {
    const series = buildCategoryTimeSeries(SESIONES, ACTIVAS);

    expect(series[2]).toEqual({ categoryId: "c3", categoryName: "Familia", points: [] });
  });

  it("ignora las categorías que no están activas", () => {
    const series = buildCategoryTimeSeries(SESIONES, ACTIVAS);

    expect(series.some((s) => s.categoryId === "cX")).toBe(false);
  });

  it("no depende del orden en que lleguen las sesiones", () => {
    const series = buildCategoryTimeSeries([...SESIONES].reverse(), ACTIVAS);

    expect(series[1].points.map((p) => p.score)).toEqual([3, 4, 7]);
  });
});
