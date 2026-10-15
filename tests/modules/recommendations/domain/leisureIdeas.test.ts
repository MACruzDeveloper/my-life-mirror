import { describe, expect, it } from "vitest";
import { LEISURE_IDEAS, isBalanced } from "@modules/recommendations/domain/leisureIdeas";
import { normalize, termToPattern } from "@modules/recommendations/domain/ideaSafety";
import safetyTerms from "@modules/recommendations/domain/catalog/safetyTerms.json";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

describe("ideas para cuando todo va bien (RF-50)", () => {
  describe("cuándo se ofrecen", () => {
    it("con tres o más categorías, todas puntuadas con 8 o más", () => {
      expect(isBalanced([8, 9, 10])).toBe(true);
      expect(isBalanced([9, 8, 8, 10])).toBe(true);
    });

    it("no, si alguna está por debajo de 8", () => {
      expect(isBalanced([9, 9, 7])).toBe(false);
    });

    it("no, si alguna está sin puntuar: no se sabe que vaya bien", () => {
      expect(isBalanced([9, 9, 9, undefined])).toBe(false);
    });

    it("no, con menos de tres categorías", () => {
      expect(isBalanced([10, 10])).toBe(false);
      expect(isBalanced([])).toBe(false);
    });
  });

  describe("el catálogo", () => {
    it("ocho ideas con clave estable y sin repetidos", () => {
      expect(LEISURE_IDEAS).toHaveLength(8);
      for (const key of LEISURE_IDEAS) expect(key).toMatch(/^ocio\.\d+$/);
      expect(new Set(LEISURE_IDEAS).size).toBe(LEISURE_IDEAS.length);
    });

    it("cada idea tiene texto en español y en inglés", () => {
      for (const key of LEISURE_IDEAS) {
        const id = key.split(".")[1];
        expect((es.recomendaciones.ocio.ideas as Record<string, string>)[id], `es: ${key}`).toBeTruthy();
        expect((en.recomendaciones.ocio.ideas as Record<string, string>)[id], `en: ${key}`).toBeTruthy();
      }
    });

    it("ninguna usa las palabras que el filtro de la IA considera consejo profesional, juicio u obligación", () => {
      const { es: esTerms, en: enTerms } = safetyTerms as unknown as Record<"es" | "en", Record<string, string[]>>;
      const patterns = [...Object.values(esTerms).flat(), ...Object.values(enTerms).flat()].map(termToPattern);
      for (const key of LEISURE_IDEAS) {
        const id = key.split(".")[1];
        for (const text of [(es.recomendaciones.ocio.ideas as Record<string, string>)[id], (en.recomendaciones.ocio.ideas as Record<string, string>)[id]]) {
          const hit = patterns.find((pattern) => pattern.test(normalize(text)));
          expect(hit, `${key}: "${text}"`).toBeUndefined();
        }
      }
    });
  });
});
