import { describe, expect, it } from "vitest";
import { DEFAULT_THRESHOLD, GENERAL_TEMPLATE_KEYS, parseThreshold, templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";

describe("recommendationCatalog (RF-18)", () => {
  it("cada categoría estándar tiene al menos dos plantillas propias", () => {
    for (const nombre of ["Economía", "Vida social", "Pareja", "Sexo", "Deporte", "Aventura", "Espiritualidad", "Familia", "Inversiones"]) {
      const claves = templateKeysFor(nombre);
      expect(claves.length).toBeGreaterThanOrEqual(2);
      expect(claves.every((c) => !c.startsWith("general."))).toBe(true);
    }
  });

  it("una categoría desconocida (p. ej. creada por el admin) usa las plantillas generales", () => {
    expect(templateKeysFor("Creatividad")).toEqual(GENERAL_TEMPLATE_KEYS);
    expect(GENERAL_TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(2);
  });

  it("parseThreshold usa el valor si es un entero de 2 a 10 y el 5 por defecto en cualquier otro caso", () => {
    expect(DEFAULT_THRESHOLD).toBe(5);
    expect(parseThreshold("6")).toBe(6);
    expect(parseThreshold(" 4 ")).toBe(4);
    for (const malo of [undefined, "", "abc", "1", "11", "5.5", "-3"]) {
      expect(parseThreshold(malo)).toBe(5);
    }
  });
});
