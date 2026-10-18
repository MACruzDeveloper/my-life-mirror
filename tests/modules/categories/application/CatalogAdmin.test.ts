import { describe, expect, it } from "vitest";
import { createAddCatalogCategory } from "@modules/categories/application/AddCatalogCategory";
import { createListCatalog } from "@modules/categories/application/ListCatalog";
import { createListCatalogLabels } from "@modules/categories/application/ListCatalogLabels";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { createRetireCatalogCategory } from "@modules/categories/application/RetireCatalogCategory";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import { SUPPORTED_LOCALES } from "@shared/domain/locales";
import { ForbiddenError, ValidationError } from "@shared/domain/DomainError";

const admin = { rol: "admin" };
const user = { rol: "usuario" };

/** Textos de una categoría nueva en todos los idiomas soportados. */
const creativity = {
  es: { name: " Creatividad ", description: " Arte y hobbies. " },
  en: { name: " Creativity ", description: " Art and hobbies. " },
};

function setup() {
  const catalog = new InMemoryCategoryCatalogRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  return {
    catalog,
    categoryRepository,
    listCatalog: createListCatalog(catalog),
    listLabels: createListCatalogLabels(catalog),
    add: createAddCatalogCategory(catalog),
    retire: createRetireCatalogCategory(catalog, categoryRepository),
    listCategories: createListCategories(categoryRepository, catalog),
  };
}

async function findByEsName(catalog: InMemoryCategoryCatalogRepository, name: string) {
  return (await catalog.findAll()).find((category) => category.translations.es?.name === name)!;
}

describe("Catálogo de categorías — administración (ADM-02)", () => {
  it("un admin lista el catálogo: las 9 estándar, cada una con su clave estable y su texto en cada idioma", async () => {
    const { listCatalog } = setup();

    const result = await listCatalog(admin);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(STANDARD_CATEGORIES.length);
    const finances = result.value.find((category) => category.key === "economia");
    expect(finances?.translations.es).toEqual({ name: "Finanzas", description: "Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo." });
    expect(finances?.translations.en?.name).toBe("Finances");
  });

  it("un admin añade una categoría con su texto en todos los idiomas, recortado, vigente y sin clave estándar", async () => {
    const { add, catalog } = setup();

    const result = await add(admin, { translations: creativity, isSensitiveData: false });

    expect(result.ok).toBe(true);
    const newValue = await findByEsName(catalog, "Creatividad");
    expect(newValue.translations).toEqual({ es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } });
    expect(newValue.key).toBeUndefined();
    expect(newValue.retiredAt).toBeUndefined();
  });

  it("exige nombre y descripción en cada idioma soportado, con límites de longitud", async () => {
    const { add } = setup();
    const withOnly = (overrides: object) => ({ translations: { ...creativity, ...overrides }, isSensitiveData: false });
    const missingEnglish = { translations: { es: creativity.es }, isSensitiveData: false } as unknown as Parameters<typeof add>[1];

    for (const input of [
      missingEnglish,
      withOnly({ en: { name: " ", description: "x" } }),
      withOnly({ en: { name: "X", description: " " } }),
      withOnly({ es: { name: "N".repeat(61), description: "x" } }),
      withOnly({ es: { name: "X", description: "d".repeat(201) } }),
    ]) {
      const result = await add(admin, input);
      expect(result.ok, JSON.stringify(input)).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError);
    }
    expect(SUPPORTED_LOCALES).toEqual(["es", "en"]);
  });

  it("un nombre no se repite en ningún idioma, sin distinguir mayúsculas (tampoco frente a las retiradas)", async () => {
    const { add, retire, catalog } = setup();
    const conflictWith = async (translations: object) => {
      const result = await add(admin, { translations: { ...creativity, ...translations } as typeof creativity, isSensitiveData: false });
      return !result.ok && result.error.code === "CONFLICT";
    };

    expect(await conflictWith({ es: { name: "finanzas", description: "x" } })).toBe(true);
    expect(await conflictWith({ en: { name: "finances", description: "x" } })).toBe(true);
    expect(await conflictWith({ en: { name: "Finanzas", description: "x" } })).toBe(true);

    await retire(admin, (await findByEsName(catalog, "Aventura")).id);
    expect(await conflictWith({ es: { name: "Aventura", description: "x" } })).toBe(true);
  });

  it("retirar la marca como retirada y desactiva, por su id de catálogo, la categoría de todos los usuarios sin borrar nada", async () => {
    const { retire, catalog, categoryRepository, listCategories } = setup();
    const listed = await listCategories("u1");
    if (!listed.ok) throw new Error("setup falló");
    const financesOfU1 = listed.value.find((category) => category.name === "Finanzas")!;
    await categoryRepository.save({ ...financesOfU1, status: "active" });
    const finances = await findByEsName(catalog, "Finanzas");

    const result = await retire(admin, finances.id);

    expect(result.ok).toBe(true);
    expect((await catalog.findAll()).find((category) => category.id === finances.id)?.retiredAt).toBeInstanceOf(Date);
    expect((await categoryRepository.findById("u1", financesOfU1.id))?.status).toBe("inactive");
  });

  it("retirar una categoría inexistente da NotFound", async () => {
    const { retire } = setup();

    const result = await retire(admin, "no-existe");

    expect(!result.ok && result.error.code).toBe("NOT_FOUND");
  });

  it("un no admin recibe Forbidden al listar, añadir o retirar, y no cambia nada", async () => {
    const { listCatalog, add, retire, catalog } = setup();
    const before = (await catalog.findAll()).length;
    const any = (await catalog.findAll())[0];

    for (const result of [await listCatalog(user), await add(user, { translations: creativity, isSensitiveData: false }), await retire({ rol: "premium" }, any.id)]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(ForbiddenError);
    }
    expect((await catalog.findAll()).length).toBe(before);
    expect((await catalog.findAll())[0].retiredAt).toBeUndefined();
  });
});

describe("ListCatalogLabels (textos de las categorías para la interfaz, RNF-10)", () => {
  it("cualquier usuario obtiene el id, la clave y el texto en cada idioma de todas las categorías, también las retiradas (el historial las nombra)", async () => {
    const { listLabels, retire, catalog } = setup();
    const adventure = await findByEsName(catalog, "Aventura");
    await retire(admin, adventure.id);

    const labels = await listLabels();

    expect(labels).toHaveLength(STANDARD_CATEGORIES.length);
    // Marcada como retirada: la página de Categorías no la ofrece, pero el historial la sigue nombrando.
    expect(labels.find((label) => label.catalogId === adventure.id)).toEqual({ catalogId: adventure.id, key: "aventura", retired: true, translations: adventure.translations });
  });
});
