import { describe, expect, it } from "vitest";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";

describe("ListCategories (RF-06)", () => {
  it("siembra las categorías estándar la primera vez, todas inactivas", async () => {
    const listCategories = createListCategories(new InMemoryCategoryRepository(), new InMemoryCategoryCatalogRepository());

    const result = await listCategories("u1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(STANDARD_CATEGORIES.length);
      expect(result.value.every((c) => c.status === "inactive")).toBe(true);
      expect(result.value.every((c) => c.type === "standard")).toBe(true);
      // Sensibles (RGPD art. 9): sexo, espiritualidad y salud (añadida el 12 oct.). Deporte dejó de serlo el 6 oct. (decisión del autor).
      expect(result.value.filter((c) => c.isSensitiveData).map((c) => c.name).sort()).toEqual(["Espiritualidad", "Salud", "Sexo"]);
    }
  });

  it("no vuelve a sembrar si ya existen categorías (idempotente)", async () => {
    const repo = new InMemoryCategoryRepository();
    const listCategories = createListCategories(repo, new InMemoryCategoryCatalogRepository());
    const first = await listCategories("u1");
    if (!first.ok) throw new Error("setup falló");
    await repo.save({ ...first.value[0], status: "active" });

    const second = await listCategories("u1");

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value).toHaveLength(STANDARD_CATEGORIES.length);
      expect(second.value.find((c) => c.id === first.value[0].id)?.status).toBe("active");
    }
  });

  it("rechaza un userId vacío", async () => {
    const listCategories = createListCategories(new InMemoryCategoryRepository(), new InMemoryCategoryCatalogRepository());

    const result = await listCategories("");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("una categoría añadida al catálogo después llega, inactiva, a un usuario que ya tenía las suyas", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();
    const listCategories = createListCategories(repo, catalog);
    await listCategories("u1");
    await catalog.save({ id: "nueva", translations: { es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } }, isSensitiveData: false });

    const result = await listCategories("u1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(STANDARD_CATEGORIES.length + 1);
      const newValue = result.value.find((c) => c.name === "Creatividad");
      expect(newValue?.status).toBe("inactive");
      expect(newValue?.type).toBe("standard");
    }
  });

  it("no lista las categorías retiradas del catálogo, pero conserva la fila del usuario", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();
    const listCategories = createListCategories(repo, catalog);
    await listCategories("u1");
    const finances = (await catalog.findAll()).find((c) => c.key === "economia")!;
    await catalog.save({ ...finances, retiredAt: new Date("2026-09-19T10:00:00Z") });

    const result = await listCategories("u1");

    expect(result.ok && result.value.some((c) => c.name === "Finanzas")).toBe(false);
    expect((await repo.findByUserId("u1")).some((c) => c.name === "Finanzas")).toBe(true);
  });

  it("cada copia apunta a su entrada del catálogo por id (no por nombre) y guarda el texto del idioma por defecto", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();

    const result = await createListCategories(repo, catalog)("u1");

    const financesCatalogEntry = (await catalog.findAll()).find((entry) => entry.key === "economia")!;
    const finances = result.ok ? result.value.find((category) => category.catalogId === financesCatalogEntry.id) : undefined;
    expect(finances).toMatchObject({ name: "Finanzas", description: "Tus finanzas: ahorro, gasto, deudas e inversión a largo plazo." });
  });

  it("si cambia el texto de una entrada del catálogo, no se crea una copia duplicada (la identidad es el id)", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();
    const listCategories = createListCategories(repo, catalog);
    await listCategories("u1");
    const finances = (await catalog.findAll()).find((entry) => entry.key === "economia")!;
    await catalog.save({ ...finances, translations: { ...finances.translations, es: { name: "Dinero", description: "d" } } });

    const result = await listCategories("u1");

    expect(result.ok && result.value).toHaveLength(STANDARD_CATEGORIES.length);
  });
});
