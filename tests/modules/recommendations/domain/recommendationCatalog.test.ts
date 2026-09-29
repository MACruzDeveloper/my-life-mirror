import { describe, expect, it } from "vitest";
import { DEFAULT_THRESHOLD, GENERAL_TEMPLATE_KEYS, parseThreshold, templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";

describe("recommendationCatalog (RF-18)", () => {
  it("cada categoría estándar (por su clave estable) tiene al menos dos plantillas propias", () => {
    for (const { key } of STANDARD_CATEGORIES) {
      const keys = templateKeysFor(key);
      expect(keys.length, key).toBeGreaterThanOrEqual(2);
      expect(keys.every((templateKey) => templateKey.startsWith(`${key}.`))).toBe(true);
    }
  });

  it("una categoría sin clave estándar (p. ej. creada por el admin) usa las plantillas generales", () => {
    expect(templateKeysFor(undefined)).toEqual(GENERAL_TEMPLATE_KEYS);
    expect(templateKeysFor("no-existe")).toEqual(GENERAL_TEMPLATE_KEYS);
    expect(GENERAL_TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(2);
  });

  it("parseThreshold usa el valor si es un entero de 2 a 10 y el 5 por defecto en cualquier otro caso", () => {
    expect(DEFAULT_THRESHOLD).toBe(5);
    expect(parseThreshold("6")).toBe(6);
    expect(parseThreshold(" 4 ")).toBe(4);
    for (const invalid of [undefined, "", "abc", "1", "11", "5.5", "-3"]) {
      expect(parseThreshold(invalid)).toBe(5);
    }
  });
});
