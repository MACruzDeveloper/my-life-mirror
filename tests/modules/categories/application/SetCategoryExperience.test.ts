import { describe, expect, it } from "vitest";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { createSetCategoryExperience } from "@modules/categories/application/SetCategoryExperience";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const listed = await createListCategories(categoryRepository, catalog)("u1");
  if (!listed.ok) throw new Error("setup falló");
  const entries = await catalog.findAll();
  const byKey = (key: string) => listed.value.find((c) => c.catalogId === entries.find((e) => e.key === key)?.id)!;
  return { categoryRepository, setCategoryExperience: createSetCategoryExperience(categoryRepository, catalog), sport: byKey("deporte"), finances: byKey("economia") };
}

describe("SetCategoryExperience (RF-41)", () => {
  it("guarda las opciones marcadas de esa categoría, sin repetir", async () => {
    const { setCategoryExperience, categoryRepository, sport } = await setup();

    const result = await setCategoryExperience({ userId: "u1", categoryId: sport.id, tags: ["deporte.caminar", "deporte.naturaleza", "deporte.caminar"] });

    expect(result.ok).toBe(true);
    expect((await categoryRepository.findById("u1", sport.id))?.experienceTags).toEqual(["deporte.caminar", "deporte.naturaleza"]);
  });

  it("una lista vacía las quita todas", async () => {
    const { setCategoryExperience, categoryRepository, sport } = await setup();
    await setCategoryExperience({ userId: "u1", categoryId: sport.id, tags: ["deporte.caminar"] });

    await setCategoryExperience({ userId: "u1", categoryId: sport.id, tags: [] });

    expect((await categoryRepository.findById("u1", sport.id))?.experienceTags).toEqual([]);
  });

  it("rechaza una opción de otra categoría y no guarda nada", async () => {
    const { setCategoryExperience, categoryRepository, sport } = await setup();

    const result = await setCategoryExperience({ userId: "u1", categoryId: sport.id, tags: ["deporte.caminar", "economia.presupuesto"] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    expect((await categoryRepository.findById("u1", sport.id))?.experienceTags ?? []).toEqual([]);
  });

  it("no toca categorías de otro usuario", async () => {
    const { setCategoryExperience, finances } = await setup();

    const result = await setCategoryExperience({ userId: "otro", categoryId: finances.id, tags: ["economia.presupuesto"] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("no cambia nada más de la categoría (estado, textos)", async () => {
    const { setCategoryExperience, categoryRepository, finances } = await setup();
    await categoryRepository.save({ ...finances, status: "active" });

    const result = await setCategoryExperience({ userId: "u1", categoryId: finances.id, tags: ["economia.presupuesto"] });

    expect(result.ok && result.value).toMatchObject({ status: "active", name: finances.name, experienceTags: ["economia.presupuesto"] });
  });
});
