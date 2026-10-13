import { describe, expect, it } from "vitest";
import { scoreFeedback } from "@modules/assessments/ui/scoreFeedback";

describe("mensaje al guardar una puntuación alta (UX-09)", () => {
  it("por debajo de 8 no dice nada: las bajas ya tienen su idea", () => {
    for (const score of [1, 5, 7]) expect(scoreFeedback({ score, isSensitive: false, canShare: true })).toBeUndefined();
  });

  it("con 8 reconoce el momento e invita a compartir, sin felicitar", () => {
    expect(scoreFeedback({ score: 8, isSensitive: false, canShare: true })).toEqual({ tone: "recognize", inviteToShare: true });
  });

  it("con 9 o 10 en una categoría no sensible, felicita con sobriedad", () => {
    for (const score of [9, 10]) expect(scoreFeedback({ score, isSensitive: false, canShare: true })).toEqual({ tone: "congratulate", inviteToShare: true });
  });

  it("en una categoría sensible nunca felicita ni invita a compartir, sea cual sea la nota", () => {
    for (const score of [8, 9, 10]) expect(scoreFeedback({ score, isSensitive: true, canShare: false })).toEqual({ tone: "recognize", inviteToShare: false });
  });

  it("donde no se comparte (Pareja) felicita igual, pero no invita a compartir", () => {
    expect(scoreFeedback({ score: 10, isSensitive: false, canShare: false })).toEqual({ tone: "congratulate", inviteToShare: false });
  });
});
