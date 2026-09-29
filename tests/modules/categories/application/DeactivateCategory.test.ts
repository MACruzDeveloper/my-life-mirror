import { describe, expect, it } from "vitest";
import { createDeactivateCategory } from "@modules/categories/application/DeactivateCategory";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";

describe("DeactivateCategory (RF-07)", () => {
  it("desactiva una categoría activa, sensible o no, sin pedir nada más", async () => {
    const repo = new InMemoryCategoryRepository();
    const listCategories = createListCategories(repo, new InMemoryCategoryCatalogRepository());
    const deactivateCategory = createDeactivateCategory(repo);
    const listado = await listCategories("u1");
    if (!listado.ok) throw new Error("setup falló");
    const sensible = listado.value.find((c) => c.isSensitiveData)!;
    await repo.save({ ...sensible, status: "active" });

    const resultado = await deactivateCategory({ userId: "u1", categoryId: sensible.id });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.status).toBe("inactive");
  });

  it("rechaza una categoría que no existe", async () => {
    const deactivateCategory = createDeactivateCategory(new InMemoryCategoryRepository());

    const resultado = await deactivateCategory({ userId: "u1", categoryId: "no-existe" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("NOT_FOUND");
  });

  it("rechaza entradas vacías", async () => {
    const deactivateCategory = createDeactivateCategory(new InMemoryCategoryRepository());

    const resultado = await deactivateCategory({ userId: "", categoryId: "c1" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });
});
