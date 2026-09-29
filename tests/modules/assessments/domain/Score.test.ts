import { describe, expect, it } from "vitest";
import { Score } from "@modules/assessments/domain/Score";

describe("Score (RF-10)", () => {
  it.each([1, 5, 10])("acepta %s", (valor) => {
    const resultado = Score.create(valor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.value).toBe(valor);
  });

  it.each([0, 11, -3, 5.5, Number.NaN, Number.POSITIVE_INFINITY])("rechaza %s", (valor) => {
    const resultado = Score.create(valor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });
});
