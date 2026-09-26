import { describe, expect, it } from "vitest";
import i18n from "@shared/ui/i18n";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import { standardCategoryKey, translateCategoryDescription, translateCategoryName } from "@modules/categories/ui/categoryLabels";

const english = i18n.getFixedT("en");
const spanish = i18n.getFixedT("es");

describe("categoryLabels (RNF-10: nombres de categorías en el idioma de la interfaz)", () => {
  it("las 9 categorías estándar tienen clave, nombre y descripción en los dos idiomas", () => {
    for (const category of STANDARD_CATEGORIES) {
      expect(standardCategoryKey(category.name), category.name).toBeDefined();
      expect(translateCategoryName(category.name, spanish)).toBe(category.name);
      expect(translateCategoryDescription(category.name, category.description, spanish)).toBe(category.description);
      expect(translateCategoryName(category.name, english)).not.toBe(category.name.normalize());
    }
  });

  it("traduce el nombre y la descripción de una categoría estándar al inglés", () => {
    expect(translateCategoryName("Economía", english)).toBe("Finances");
    expect(translateCategoryName("Vida social", english)).toBe("Social life");
    expect(translateCategoryDescription("Deporte", "Actividad física y salud.", english)).toBe("Physical activity and health.");
  });

  it("una categoría creada por el admin conserva su nombre y descripción tal cual", () => {
    expect(standardCategoryKey("Creatividad")).toBeUndefined();
    expect(translateCategoryName("Creatividad", english)).toBe("Creatividad");
    expect(translateCategoryDescription("Creatividad", "Arte y hobbies.", english)).toBe("Arte y hobbies.");
  });
});
