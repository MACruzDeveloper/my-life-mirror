import { describe, expect, it } from "vitest";
import ideas from "@modules/recommendations/domain/catalog/ideas.json";
import situations from "@modules/recommendations/domain/catalog/situations.json";
import safetyTerms from "@modules/recommendations/domain/catalog/safetyTerms.json";
import { RETIRED_CATEGORY_KEYS, STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import i18n from "@shared/ui/i18n";

// CAT-01: el contenido curado es un JSON que se edita a mano; estos tests avisan si se edita mal.
const standardKeys = new Set<string>([...STANDARD_CATEGORIES.map(({ key }) => key), ...RETIRED_CATEGORY_KEYS]) // las retiradas conservan su contenido para el historial;
const ideaKeys = ideas.map((idea) => idea.key);

function hasText(key: string) {
  for (const language of ["es", "en"]) {
    const text = i18n.t(key, { lng: language, categoria: "X" });
    if (text === key || text.length < 3) return `${language}:${key}`;
  }
  return null;
}

describe("catálogo de ideas (CAT-01)", () => {
  it("cada idea tiene una clave única con forma <categoría>.<n>, de una categoría estándar o general", () => {
    expect(new Set(ideaKeys).size).toBe(ideaKeys.length);
    for (const idea of ideas) {
      const prefix = idea.category ?? "general";
      expect(idea.key, idea.key).toMatch(new RegExp(`^${prefix}\\.\\d+$`));
      if (idea.category !== null) expect(standardKeys.has(idea.category), idea.key).toBe(true);
    }
  });

  it("cada categoría estándar tiene ideas propias, y hay ideas generales", () => {
    for (const key of standardKeys) expect(ideas.some((idea) => idea.category === key), key).toBe(true);
    expect(ideas.some((idea) => idea.category === null)).toBe(true);
  });

  it("toda idea tiene texto en español y en inglés", () => {
    expect(ideaKeys.map((key) => hasText(`recomendaciones.plantillas.${key}`)).filter(Boolean)).toEqual([]);
  });
});

describe("catálogo de situaciones (CAT-01, RF-42)", () => {
  it("claves únicas; cada situación choca con alguna idea y solo con ideas que existen", () => {
    const keys = situations.map((situation) => situation.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const situation of situations) {
      expect(situation.clashesWith.length, situation.key).toBeGreaterThan(0);
      for (const idea of situation.clashesWith) expect(ideaKeys, `${situation.key} → ${idea}`).toContain(idea);
    }
  });

  it("siempre queda alguna idea general que no choca con nada (el carrusel nunca se queda vacío)", () => {
    const clashing = new Set(situations.flatMap((situation) => situation.clashesWith));
    expect(ideas.some((idea) => idea.category === null && !clashing.has(idea.key))).toBe(true);
  });

  it("toda situación tiene texto en español y en inglés", () => {
    expect(situations.map((situation) => hasText(`situaciones.${situation.key}`)).filter(Boolean)).toEqual([]);
  });
});

describe("términos del filtro de ideas con IA (CAT-01)", () => {
  it("hay términos en los dos idiomas", () => {
    for (const language of ["es", "en"] as const) expect(Object.values(safetyTerms[language]).flat().length, language).toBeGreaterThan(0);
  });
});
