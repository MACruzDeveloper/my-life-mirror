import { describe, expect, it } from "vitest";
import { buildBalance, MIN_SCORED_CATEGORIES } from "@modules/assessments/ui/balance/balance";

describe("buildBalance (RF-15)", () => {
  const latestScores = [
    { categoryId: "c1", categoryName: "Finanzas", score: 7 },
    { categoryId: "c2", categoryName: "Familia" },
    { categoryId: "c3", categoryName: "Deporte", score: 3 },
    { categoryId: "c4", categoryName: "Aventura", score: 9 },
  ];

  it("entran las puntuadas, en el orden recibido (el del catálogo), nunca ordenadas por puntuación", () => {
    const balance = buildBalance(latestScores);

    expect(balance.axes).toEqual([
      { name: "Finanzas", value: 7 },
      { name: "Deporte", value: 3 },
      { name: "Aventura", value: 9 },
    ]);
  });

  it("las no puntuadas quedan fuera y se listan como pendientes", () => {
    expect(buildBalance(latestScores).unscoredNames).toEqual(["Familia"]);
  });

  it("hace falta un mínimo de tres puntuadas para dibujar el radar", () => {
    expect(MIN_SCORED_CATEGORIES).toBe(3);
    expect(buildBalance(latestScores).hasEnoughData).toBe(true);
    expect(buildBalance(latestScores.slice(0, 3)).hasEnoughData).toBe(false);
  });
});
