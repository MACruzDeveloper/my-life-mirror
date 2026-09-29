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
const usuario = { rol: "usuario" };

/** Textos de una categoría nueva en todos los idiomas soportados. */
const creatividad = {
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

    const resultado = await listCatalog(admin);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value).toHaveLength(STANDARD_CATEGORIES.length);
    const economia = resultado.value.find((category) => category.key === "economia");
    expect(economia?.translations.es).toEqual({ name: "Economía", description: "Tus finanzas personales: ahorro, gasto, deudas." });
    expect(economia?.translations.en?.name).toBe("Finances");
  });

  it("un admin añade una categoría con su texto en todos los idiomas, recortado, vigente y sin clave estándar", async () => {
    const { add, catalog } = setup();

    const resultado = await add(admin, { translations: creatividad, isSensitiveData: false });

    expect(resultado.ok).toBe(true);
    const nueva = await findByEsName(catalog, "Creatividad");
    expect(nueva.translations).toEqual({ es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } });
    expect(nueva.key).toBeUndefined();
    expect(nueva.retiredAt).toBeUndefined();
  });

  it("exige nombre y descripción en cada idioma soportado, con límites de longitud", async () => {
    const { add } = setup();
    const withOnly = (overrides: object) => ({ translations: { ...creatividad, ...overrides }, isSensitiveData: false });
    const missingEnglish = { translations: { es: creatividad.es }, isSensitiveData: false } as unknown as Parameters<typeof add>[1];

    for (const input of [
      missingEnglish,
      withOnly({ en: { name: " ", description: "x" } }),
      withOnly({ en: { name: "X", description: " " } }),
      withOnly({ es: { name: "N".repeat(61), description: "x" } }),
      withOnly({ es: { name: "X", description: "d".repeat(201) } }),
    ]) {
      const resultado = await add(admin, input);
      expect(resultado.ok, JSON.stringify(input)).toBe(false);
      if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
    }
    expect(SUPPORTED_LOCALES).toEqual(["es", "en"]);
  });

  it("un nombre no se repite en ningún idioma, sin distinguir mayúsculas (tampoco frente a las retiradas)", async () => {
    const { add, retire, catalog } = setup();
    const conflictWith = async (translations: object) => {
      const resultado = await add(admin, { translations: { ...creatividad, ...translations } as typeof creatividad, isSensitiveData: false });
      return !resultado.ok && resultado.error.code === "CONFLICT";
    };

    expect(await conflictWith({ es: { name: "economía", description: "x" } })).toBe(true);
    expect(await conflictWith({ en: { name: "finances", description: "x" } })).toBe(true);
    expect(await conflictWith({ en: { name: "Economía", description: "x" } })).toBe(true);

    await retire(admin, (await findByEsName(catalog, "Aventura")).id);
    expect(await conflictWith({ es: { name: "Aventura", description: "x" } })).toBe(true);
  });

  it("retirar la marca como retirada y desactiva, por su id de catálogo, la categoría de todos los usuarios sin borrar nada", async () => {
    const { retire, catalog, categoryRepository, listCategories } = setup();
    const listado = await listCategories("u1");
    if (!listado.ok) throw new Error("setup falló");
    const economiaDeU1 = listado.value.find((category) => category.name === "Economía")!;
    await categoryRepository.save({ ...economiaDeU1, status: "active" });
    const economia = await findByEsName(catalog, "Economía");

    const resultado = await retire(admin, economia.id);

    expect(resultado.ok).toBe(true);
    expect((await catalog.findAll()).find((category) => category.id === economia.id)?.retiredAt).toBeInstanceOf(Date);
    expect((await categoryRepository.findById("u1", economiaDeU1.id))?.status).toBe("inactive");
  });

  it("retirar una categoría inexistente da NotFound", async () => {
    const { retire } = setup();

    const resultado = await retire(admin, "no-existe");

    expect(!resultado.ok && resultado.error.code).toBe("NOT_FOUND");
  });

  it("un no admin recibe Forbidden al listar, añadir o retirar, y no cambia nada", async () => {
    const { listCatalog, add, retire, catalog } = setup();
    const before = (await catalog.findAll()).length;
    const any = (await catalog.findAll())[0];

    for (const resultado of [await listCatalog(usuario), await add(usuario, { translations: creatividad, isSensitiveData: false }), await retire({ rol: "premium" }, any.id)]) {
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ForbiddenError);
    }
    expect((await catalog.findAll()).length).toBe(before);
    expect((await catalog.findAll())[0].retiredAt).toBeUndefined();
  });
});

describe("ListCatalogLabels (textos de las categorías para la interfaz, RNF-10)", () => {
  it("cualquier usuario obtiene el id, la clave y el texto en cada idioma de todas las categorías, también las retiradas (el historial las nombra)", async () => {
    const { listLabels, retire, catalog } = setup();
    const aventura = await findByEsName(catalog, "Aventura");
    await retire(admin, aventura.id);

    const labels = await listLabels();

    expect(labels).toHaveLength(STANDARD_CATEGORIES.length);
    expect(labels.find((label) => label.catalogId === aventura.id)).toEqual({ catalogId: aventura.id, key: "aventura", translations: aventura.translations });
  });
});
