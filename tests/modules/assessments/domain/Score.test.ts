import { describe, expect, it } from "vitest";
import { Score } from "@modules/assessments/domain/Score";

describe("Score (RF-10)", () => {
  it.each([1, 5, 10])("acepta %s", (value) => {
    const result = Score.create(value);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.value).toBe(value);
  });

  it.each([0, 11, -3, 5.5, Number.NaN, Number.POSITIVE_INFINITY])("rechaza %s", (value) => {
    const result = Score.create(value);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });
});
