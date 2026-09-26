import { describe, expect, it } from "vitest";
import { createAddCatalogCategory } from "@modules/categories/application/AddCatalogCategory";
import { createListCatalog } from "@modules/categories/application/ListCatalog";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { createRetireCatalogCategory } from "@modules/categories/application/RetireCatalogCategory";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import { ForbiddenError, ValidationError } from "@shared/domain/DomainError";

const admin = { rol: "admin" };
const usuario = { rol: "usuario" };

function setup() {
  const catalog = new InMemoryCategoryCatalogRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  return {
    catalog,
    categoryRepository,
    listCatalog: createListCatalog(catalog),
    add: createAddCatalogCategory(catalog),
    retire: createRetireCatalogCategory(catalog, categoryRepository),
    listCategories: createListCategories(categoryRepository, catalog),
  };
}

describe("Catálogo de categorías — administración (ADM-02)", () => {
  it("un admin lista el catálogo, con las 9 estándar sembradas", async () => {
    const { listCatalog } = setup();

    const resultado = await listCatalog(admin);

    expect(resultado.ok && resultado.value).toHaveLength(STANDARD_CATEGORIES.length);
  });

  it("un admin añade una categoría y aparece en el catálogo, vigente", async () => {
    const { add, listCatalog } = setup();

    const resultado = await add(admin, { name: " Creatividad ", description: "Arte y hobbies.", nameEn: " Creativity ", descriptionEn: " Art and hobbies. ", isSensitiveData: false });

    expect(resultado.ok).toBe(true);
    const catalogo = await listCatalog(admin);
    const nueva = catalogo.ok ? catalogo.value.find((c) => c.name === "Creatividad") : undefined;
    expect(nueva).toBeDefined();
    expect(nueva?.retiredAt).toBeUndefined();
  });

  it("rechaza nombre o descripción vacíos o demasiado largos", async () => {
    const { add } = setup();

    expect((await add(admin, { name: "  ", description: "x", nameEn: "Y", descriptionEn: "y", isSensitiveData: false })).ok).toBe(false);
    expect((await add(admin, { name: "X", description: " ", nameEn: "Y", descriptionEn: "y", isSensitiveData: false })).ok).toBe(false);
    expect((await add(admin, { name: "N".repeat(61), description: "x", nameEn: "Y", descriptionEn: "y", isSensitiveData: false })).ok).toBe(false);
    expect((await add(admin, { name: "X", description: "d".repeat(201), nameEn: "Y", descriptionEn: "y", isSensitiveData: false })).ok).toBe(false);
  });

  it("rechaza un nombre duplicado, sin distinguir mayúsculas (también si está retirada)", async () => {
    const { add, retire, catalog } = setup();
    const duplicada = await add(admin, { name: "economía", description: "x", nameEn: "Y", descriptionEn: "y", isSensitiveData: false });
    expect(duplicada.ok).toBe(false);
    if (!duplicada.ok) expect(duplicada.error.code).toBe("CONFLICT");

    const economia = (await catalog.findAll()).find((c) => c.name === "Economía")!;
    await retire(admin, economia.id);
    expect((await add(admin, { name: "Economía", description: "x", nameEn: "Y", descriptionEn: "y", isSensitiveData: false })).ok).toBe(false);
  });

  it("retirar la marca como retirada y desactiva la categoría de todos los usuarios sin borrar nada", async () => {
    const { retire, catalog, categoryRepository, listCategories } = setup();
    const listado = await listCategories("u1");
    if (!listado.ok) throw new Error("setup falló");
    const economiaDeU1 = listado.value.find((c) => c.name === "Economía")!;
    await categoryRepository.save({ ...economiaDeU1, status: "active" });
    const economia = (await catalog.findAll()).find((c) => c.name === "Economía")!;

    const resultado = await retire(admin, economia.id);

    expect(resultado.ok).toBe(true);
    expect((await catalog.findAll()).find((c) => c.id === economia.id)?.retiredAt).toBeInstanceOf(Date);
    const fila = await categoryRepository.findById("u1", economiaDeU1.id);
    expect(fila?.status).toBe("inactive");
  });

  it("retirar una categoría inexistente da NotFound", async () => {
    const { retire } = setup();

    const resultado = await retire(admin, "no-existe");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("NOT_FOUND");
  });

  it("un no admin recibe Forbidden en las tres operaciones y no cambia nada", async () => {
    const { listCatalog, add, retire, catalog } = setup();
    const antes = (await catalog.findAll()).length;
    const cualquiera = (await catalog.findAll())[0];

    for (const resultado of [
      await listCatalog(usuario),
      await add(usuario, { name: "Hack", description: "x", nameEn: "Y", descriptionEn: "y", isSensitiveData: false }),
      await retire({ rol: "premium" }, cualquiera.id),
    ]) {
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ForbiddenError);
    }
    expect((await catalog.findAll()).length).toBe(antes);
    expect((await catalog.findAll())[0].retiredAt).toBeUndefined();
  });

  it("guarda el nombre y la descripción en inglés (RNF-10), recortados", async () => {
    const { add, catalog } = setup();

    const resultado = await add(admin, { name: "Creatividad", description: "Arte y hobbies.", nameEn: " Creativity ", descriptionEn: " Art and hobbies. ", isSensitiveData: false });

    expect(resultado.ok).toBe(true);
    const nueva = (await catalog.findAll()).find((c) => c.name === "Creatividad");
    expect(nueva).toMatchObject({ nameEn: "Creativity", descriptionEn: "Art and hobbies." });
  });

  it("el nombre y la descripción en inglés son obligatorios y tienen los mismos límites", async () => {
    const { add } = setup();
    const base = { name: "Creatividad", description: "Arte.", isSensitiveData: false };

    for (const english of [{ nameEn: " ", descriptionEn: "x" }, { nameEn: "X", descriptionEn: " " }, { nameEn: "N".repeat(61), descriptionEn: "x" }, { nameEn: "X", descriptionEn: "d".repeat(201) }]) {
      const resultado = await add(admin, { ...base, ...english });
      expect(resultado.ok, JSON.stringify(english)).toBe(false);
      if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
    }
  });

  it("rechaza un nombre en inglés que ya use otra categoría, sin distinguir mayúsculas", async () => {
    const { add } = setup();
    await add(admin, { name: "Creatividad", description: "Arte.", nameEn: "Creativity", descriptionEn: "Art.", isSensitiveData: false });

    const repetida = await add(admin, { name: "Arte", description: "Arte.", nameEn: "creativity", descriptionEn: "Art.", isSensitiveData: false });

    expect(repetida.ok).toBe(false);
    if (!repetida.ok) expect(repetida.error.code).toBe("CONFLICT");
  });
});
