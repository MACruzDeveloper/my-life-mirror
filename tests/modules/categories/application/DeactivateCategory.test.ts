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
    const listed = await listCategories("u1");
    if (!listed.ok) throw new Error("setup falló");
    const sensitive = listed.value.find((c) => c.isSensitiveData)!;
    await repo.save({ ...sensitive, status: "active" });

    const result = await deactivateCategory({ userId: "u1", categoryId: sensitive.id });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("inactive");
  });

  it("rechaza una categoría que no existe", async () => {
    const deactivateCategory = createDeactivateCategory(new InMemoryCategoryRepository());

    const result = await deactivateCategory({ userId: "u1", categoryId: "no-existe" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("rechaza entradas vacías", async () => {
    const deactivateCategory = createDeactivateCategory(new InMemoryCategoryRepository());

    const result = await deactivateCategory({ userId: "", categoryId: "c1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });
});
