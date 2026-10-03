import { describe, expect, it } from "vitest";
import { experienceOptionsFor } from "@modules/categories/domain/experienceOptions";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

function label(locale: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], (locale as { experiencias?: unknown }).experiencias);
}

describe("experienceOptions (RF-41)", () => {
  it("cada categoría estándar tiene entre 5 y 7 opciones propias, sin repetir, con su clave delante", () => {
    for (const { key } of STANDARD_CATEGORIES) {
      const options = experienceOptionsFor(key);
      expect(options.length, key).toBeGreaterThanOrEqual(5);
      expect(options.length, key).toBeLessThanOrEqual(7);
      expect(new Set(options).size, key).toBe(options.length);
      for (const option of options) expect(option.startsWith(`${key}.`), option).toBe(true);
    }
  });

  it("toda opción tiene texto en español y en inglés", () => {
    for (const { key } of STANDARD_CATEGORIES) {
      for (const option of experienceOptionsFor(key)) {
        expect(typeof label(es, option), `es: ${option}`).toBe("string");
        expect(typeof label(en, option), `en: ${option}`).toBe("string");
      }
    }
  });

  it("una categoría sin clave (creada por el admin) o desconocida no tiene opciones", () => {
    expect(experienceOptionsFor(undefined)).toEqual([]);
    expect(experienceOptionsFor("no-existe")).toEqual([]);
  });
});
