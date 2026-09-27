import { describe, expect, it } from "vitest";
import { resolveCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { catalogIdOf, categoryLabelsFixture } from "../../../helpers/categoryLabels";

const labelsById = new Map(
  categoryLabelsFixture([
    { catalogId: "k-creatividad", translations: { es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } } },
    { catalogId: "k-solo-es", translations: { es: { name: "Solo español", description: "Sin traducir." } } },
  ]).map((label) => [label.catalogId, label]),
);

describe("resolveCategoryLabel (RNF-10: la categoría se nombra por su id, en el idioma de la interfaz)", () => {
  it("devuelve el nombre y la descripción en el idioma pedido, y la clave estable si es estándar", () => {
    expect(resolveCategoryLabel(labelsById, catalogIdOf("economia"), "en")).toEqual({ name: "Finances", description: "Your personal finances: savings, spending, debts.", key: "economia" });
    expect(resolveCategoryLabel(labelsById, catalogIdOf("economia"), "es").name).toBe("Economía");
  });

  it("las categorías del admin se traducen igual que las estándar, sin clave", () => {
    expect(resolveCategoryLabel(labelsById, "k-creatividad", "en")).toEqual({ name: "Creativity", description: "Art and hobbies." });
  });

  it("si falta el idioma pedido, usa el idioma por defecto (español)", () => {
    expect(resolveCategoryLabel(labelsById, "k-solo-es", "en").name).toBe("Solo español");
    expect(resolveCategoryLabel(labelsById, catalogIdOf("economia"), "fr").name).toBe("Economía");
  });

  it("un id desconocido o ausente devuelve texto vacío, nunca un error", () => {
    expect(resolveCategoryLabel(labelsById, "no-existe", "es")).toEqual({ name: "", description: "" });
    expect(resolveCategoryLabel(labelsById, undefined, "es")).toEqual({ name: "", description: "" });
  });
});
