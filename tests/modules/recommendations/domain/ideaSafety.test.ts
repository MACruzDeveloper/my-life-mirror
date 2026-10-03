import { describe, expect, it } from "vitest";
import { checkIdeaSafety, termToPattern } from "@modules/recommendations/domain/ideaSafety";
import terms from "@modules/recommendations/domain/ideaSafetyTerms.json";
import type { IdeaRequest } from "@modules/recommendations/domain/IdeaWriter";
import evaluation from "./ideaSafety.cases.json";

function requestFor(locale: "es" | "en"): IdeaRequest {
  return {
    locale,
    categoryKey: "deporte",
    score: 3,
    trend: "down",
    helpfulThings: [],
    candidates: [
      { templateKey: "deporte.1", text: "..." },
      { templateKey: "deporte.2", text: "..." },
    ],
  };
}

describe("checkIdeaSafety (RF-40): conjunto de evaluación", () => {
  for (const testCase of evaluation.cases) {
    it(`${testCase.safe ? "acepta" : "rechaza"}: ${testCase.name}`, () => {
      const result = checkIdeaSafety({ templateKey: testCase.templateKey, text: testCase.text }, requestFor(testCase.locale as "es" | "en"));

      expect(result.safe).toBe(testCase.safe);
      if (!result.safe && "reason" in testCase) expect(result.reason).toBe(testCase.reason);
    });
  }
});

describe("ideaSafetyTerms.json (RF-40): la lista editable", () => {
  it("tiene los mismos tipos de término en español y en inglés, ninguno vacío", () => {
    expect(Object.keys(terms.es).sort()).toEqual(Object.keys(terms.en).sort());
    for (const locale of ["es", "en"] as const) {
      for (const [kind, list] of Object.entries(terms[locale])) expect(list.length, `${locale}.${kind}`).toBeGreaterThan(0);
    }
  });

  it("'*' al final admite lo que siga de la palabra; sin él, solo la palabra entera; sin tildes ni mayúsculas", () => {
    expect(termToPattern("fracas*").test("un fracasado")).toBe(true);
    expect(termToPattern("vago").test("vagones")).toBe(false);
    expect(termToPattern("depresión").test("tienes depresion")).toBe(true);
    expect(termToPattern("tienes que").test("tienes   que salir")).toBe(true);
  });
});
