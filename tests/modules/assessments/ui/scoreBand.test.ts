import { describe, expect, it } from "vitest";
import { BAND_COLORS, scoreBand } from "@modules/assessments/ui/scoreBand";

describe("scoreBand", () => {
  it.each([
    [1, "low"],
    [3, "low"],
    [4, "mediumLow"],
    [5, "mediumLow"],
    [6, "medium"],
    [7, "medium"],
    [8, "high"],
    [10, "high"],
  ])("puntuación %s → %s", (score, band) => {
    expect(scoreBand(score)).toBe(band);
  });

  it("cada banda tiene colores propios y distintos", () => {
    const backgrounds = Object.values(BAND_COLORS).map((c) => c.bg);
    expect(new Set(backgrounds).size).toBe(4);
  });
});
