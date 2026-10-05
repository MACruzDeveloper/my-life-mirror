import { describe, expect, it } from "vitest";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { createSetCategoryDifficulties } from "@modules/recommendations/application/SetCategoryDifficulties";

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const listed = await createListCategories(categoryRepository, catalog)("u1");
  if (!listed.ok) throw new Error("setup falló");
  const entries = await catalog.findAll();
  const byKey = (key: string) => listed.value.find((c) => c.catalogId === entries.find((e) => e.key === key)?.id)!;
  return { categoryRepository, setCategoryDifficulties: createSetCategoryDifficulties(categoryRepository, catalog), finances: byKey("economia") };
}

describe("SetCategoryDifficulties (RF-42)", () => {
  it("guarda las situaciones marcadas de esa categoría, sin repetir", async () => {
    const { setCategoryDifficulties, categoryRepository, finances } = await setup();

    const result = await setCategoryDifficulties({ userId: "u1", categoryId: finances.id, tags: ["apuntarYRegistrar", "mirarMisCuentas", "apuntarYRegistrar"] });

    expect(result.ok).toBe(true);
    expect((await categoryRepository.findById("u1", finances.id))?.difficultyTags).toEqual(["apuntarYRegistrar", "mirarMisCuentas"]);
  });

  it("una lista vacía las quita todas", async () => {
    const { setCategoryDifficulties, categoryRepository, finances } = await setup();
    await setCategoryDifficulties({ userId: "u1", categoryId: finances.id, tags: ["mirarMisCuentas"] });

    await setCategoryDifficulties({ userId: "u1", categoryId: finances.id, tags: [] });

    expect((await categoryRepository.findById("u1", finances.id))?.difficultyTags).toEqual([]);
  });

  it("rechaza una situación que no se ofrece en esa categoría y no guarda nada", async () => {
    const { setCategoryDifficulties, categoryRepository, finances } = await setup();

    const result = await setCategoryDifficulties({ userId: "u1", categoryId: finances.id, tags: ["mirarMisCuentas", "salirDeCasa"] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    expect((await categoryRepository.findById("u1", finances.id))?.difficultyTags ?? []).toEqual([]);
  });

  it("una categoría de otro usuario no existe para este", async () => {
    const { setCategoryDifficulties, finances } = await setup();

    const result = await setCategoryDifficulties({ userId: "otro", categoryId: finances.id, tags: [] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("exige usuario y categoría", async () => {
    const { setCategoryDifficulties, finances } = await setup();

    expect((await setCategoryDifficulties({ userId: " ", categoryId: finances.id, tags: [] })).ok).toBe(false);
    expect((await setCategoryDifficulties({ userId: "u1", categoryId: " ", tags: [] })).ok).toBe(false);
  });
});
