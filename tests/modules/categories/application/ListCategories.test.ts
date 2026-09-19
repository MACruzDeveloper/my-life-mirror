import { describe, expect, it } from "vitest";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";

describe("ListCategories (RF-06)", () => {
  it("siembra las categorías estándar la primera vez, todas inactivas", async () => {
    const listCategories = createListCategories(new InMemoryCategoryRepository(), new InMemoryCategoryCatalogRepository());

    const resultado = await listCategories("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toHaveLength(STANDARD_CATEGORIES.length);
      expect(resultado.value.every((c) => c.status === "inactive")).toBe(true);
      expect(resultado.value.every((c) => c.type === "standard")).toBe(true);
      expect(resultado.value.some((c) => c.name === "Sexo" && c.isSensitiveData)).toBe(true);
      expect(resultado.value.some((c) => c.name === "Economía" && !c.isSensitiveData)).toBe(true);
    }
  });

  it("no vuelve a sembrar si ya existen categorías (idempotente)", async () => {
    const repo = new InMemoryCategoryRepository();
    const listCategories = createListCategories(repo, new InMemoryCategoryCatalogRepository());
    const primera = await listCategories("u1");
    if (!primera.ok) throw new Error("setup falló");
    await repo.save({ ...primera.value[0], status: "active" });

    const segunda = await listCategories("u1");

    expect(segunda.ok).toBe(true);
    if (segunda.ok) {
      expect(segunda.value).toHaveLength(STANDARD_CATEGORIES.length);
      expect(segunda.value.find((c) => c.id === primera.value[0].id)?.status).toBe("active");
    }
  });

  it("rechaza un userId vacío", async () => {
    const listCategories = createListCategories(new InMemoryCategoryRepository(), new InMemoryCategoryCatalogRepository());

    const resultado = await listCategories("");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("una categoría añadida al catálogo después llega, inactiva, a un usuario que ya tenía las suyas", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();
    const listCategories = createListCategories(repo, catalog);
    await listCategories("u1");
    await catalog.save({ id: "nueva", name: "Creatividad", description: "Arte y hobbies.", isSensitiveData: false });

    const resultado = await listCategories("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toHaveLength(STANDARD_CATEGORIES.length + 1);
      const nueva = resultado.value.find((c) => c.name === "Creatividad");
      expect(nueva?.status).toBe("inactive");
      expect(nueva?.type).toBe("standard");
    }
  });

  it("no lista las categorías retiradas del catálogo, pero conserva la fila del usuario", async () => {
    const repo = new InMemoryCategoryRepository();
    const catalog = new InMemoryCategoryCatalogRepository();
    const listCategories = createListCategories(repo, catalog);
    await listCategories("u1");
    const economia = (await catalog.findAll()).find((c) => c.name === "Economía")!;
    await catalog.save({ ...economia, retiredAt: new Date("2026-09-19T10:00:00Z") });

    const resultado = await listCategories("u1");

    expect(resultado.ok && resultado.value.some((c) => c.name === "Economía")).toBe(false);
    expect((await repo.findByUserId("u1")).some((c) => c.name === "Economía")).toBe(true);
  });
});
