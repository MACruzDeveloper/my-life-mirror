import { describe, expect, it } from "vitest";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";

describe("ListCategories (RF-06)", () => {
  it("siembra las categorías estándar la primera vez, todas inactivas", async () => {
    const listCategories = createListCategories(new InMemoryCategoryRepository());

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
    const listCategories = createListCategories(repo);
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
    const listCategories = createListCategories(new InMemoryCategoryRepository());

    const resultado = await listCategories("");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });
});
