import { describe, expect, it } from "vitest";
import helpOptions from "@modules/categories/domain/catalog/helpOptions.json";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import i18n from "@shared/ui/i18n";

// CAT-01: opciones de "¿Qué te ayuda?" (RF-41) como datos; estos tests avisan si se edita mal el JSON.
describe("catálogo de opciones de '¿Qué te ayuda?' (CAT-01, RF-41)", () => {
  it("claves únicas, de una categoría estándar y con su prefijo", () => {
    const keys = helpOptions.map((option) => option.key);
    const standardKeys = new Set(STANDARD_CATEGORIES.map(({ key }) => key));
    expect(new Set(keys).size).toBe(keys.length);
    for (const option of helpOptions) {
      expect(standardKeys.has(option.category), option.key).toBe(true);
      expect(option.key.startsWith(`${option.category}.`), option.key).toBe(true);
    }
  });

  it("toda opción tiene texto en español y en inglés", () => {
    const missing = helpOptions.flatMap((option) => ["es", "en"].filter((language) => i18n.t(`experiencias.${option.key}`, { lng: language }) === `experiencias.${option.key}`).map((language) => `${language}:${option.key}`));
    expect(missing).toEqual([]);
  });
});
