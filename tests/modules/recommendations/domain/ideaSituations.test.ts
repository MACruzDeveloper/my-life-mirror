import { describe, expect, it } from "vitest";
import { allowedTemplateKeys, DIFFICULT_SITUATIONS, situationOptionsFor } from "@modules/recommendations/domain/ideaSituations";
import { GENERAL_TEMPLATE_KEYS, templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";

describe("situaciones que lo ponen difícil (RF-42)", () => {
  it("cada categoría ofrece solo las situaciones que chocan con alguna de sus ideas, en el orden de la lista", () => {
    expect(situationOptionsFor("economia")).toEqual(["hablarDeLoQueSiento", "apuntarYRegistrar", "mirarMisCuentas"]);
    expect(situationOptionsFor("familia")).toEqual(["darElPrimerPaso", "hablarDeLoQueSiento", "llamarPorTelefono", "contactoConFamilia"]);
  });

  it("una categoría sin ideas propias ofrece las que tocan a las generales", () => {
    expect(situationOptionsFor(undefined)).toEqual(["apuntarYRegistrar"]);
    expect(situationOptionsFor("creadaPorElAdmin")).toEqual(["apuntarYRegistrar"]);
  });

  it("toda situación choca con alguna idea, y toda idea que choca existe en el catálogo", () => {
    const allTemplates = new Set([...STANDARD_CATEGORIES.flatMap(({ key }) => templateKeysFor(key)), ...GENERAL_TEMPLATE_KEYS]);
    const offered = new Set([...STANDARD_CATEGORIES.flatMap(({ key }) => situationOptionsFor(key)), ...situationOptionsFor(undefined)]);
    for (const situation of DIFFICULT_SITUATIONS) expect(offered.has(situation), situation).toBe(true);
    for (const key of STANDARD_CATEGORIES.flatMap(({ key: categoryKey }) => allowedTemplateKeys(categoryKey, []))) expect(allTemplates.has(key)).toBe(true);
  });

  it("sin nada marcado, se permiten todas las ideas de la categoría", () => {
    expect(allowedTemplateKeys("economia", [])).toEqual(templateKeysFor("economia"));
  });

  it("quita las ideas que chocan con lo marcado", () => {
    expect(allowedTemplateKeys("economia", ["apuntarYRegistrar"])).toEqual(["economia.2", "economia.3", "economia.5"]);
    expect(allowedTemplateKeys("economia", ["apuntarYRegistrar", "mirarMisCuentas", "hablarDeLoQueSiento"])).toEqual(["economia.2", "economia.3"]);
  });

  it("si chocan todas las de la categoría, usa las generales que no choquen", () => {
    expect(allowedTemplateKeys("familia", ["contactoConFamilia"])).toEqual(GENERAL_TEMPLATE_KEYS);
    expect(allowedTemplateKeys("familia", ["contactoConFamilia", "apuntarYRegistrar"])).toEqual(["general.2", "general.3"]);
  });

  it("aunque se marquen todas las situaciones, siempre queda alguna idea (el carrusel nunca se queda vacío)", () => {
    for (const categoryKey of [...STANDARD_CATEGORIES.map(({ key }) => key), undefined]) {
      expect(allowedTemplateKeys(categoryKey, [...DIFFICULT_SITUATIONS]).length, String(categoryKey)).toBeGreaterThan(0);
    }
  });

  it("ignora claves que no son situaciones conocidas", () => {
    expect(allowedTemplateKeys("economia", ["noExiste"])).toEqual(templateKeysFor("economia"));
  });
});
