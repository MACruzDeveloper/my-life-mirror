import { describe, expect, it } from "vitest";
import { hasOffensiveTerms } from "@modules/recommendations/domain/offensiveTerms";
import terms from "@modules/recommendations/domain/catalog/offensiveTerms.json";

describe("términos ofensivos antes de enviar una experiencia a la IA (RF-45 v1.4)", () => {
  it.each(["Mi jefe es un gilipollas", "Qué IMBÉCIL soy a veces", "My boss is an idiot", "Estoy hasta los cojones"])("avisa con insultos o palabras ofensivas: %s", (text) => {
    expect(hasOffensiveTerms(text)).toBe(true);
  });

  it.each([
    "Estoy fatal y no puedo más",
    "Me siento un fracaso este mes",
    "Me agobian los sitios con mucha gente",
    "Lloré bastante al hablar con mi hermana",
    "I feel terrible and lonely",
  ])("no avisa por cómo se siente la persona, aunque sea duro (no es detectar riesgo, RES-09): %s", (text) => {
    expect(hasOffensiveTerms(text)).toBe(false);
  });

  it("no confunde palabras que solo empiezan igual ('idiomas' no es 'idiota')", () => {
    expect(hasOffensiveTerms("Estoy aprendiendo idiomas")).toBe(false);
  });

  it("la lista tiene términos en los dos idiomas, sin repetir", () => {
    for (const language of ["es", "en"] as const) {
      expect(terms[language].length, language).toBeGreaterThan(5);
      expect(new Set(terms[language]).size, language).toBe(terms[language].length);
    }
  });
});
