import { describe, expect, it } from "vitest";
import { createListIdeaReactions, createSetIdeaReaction } from "@modules/recommendations/application/IdeaReactions";
import { InMemoryIdeaReactionRepository } from "@modules/recommendations/infrastructure/InMemoryIdeaReactionRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";

async function setup() {
  let now = new Date("2026-10-12T10:00:00Z");
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const listCategories = createListCategories(categoryRepository, catalog);
  for (const userId of ["ana", "luis"]) await listCategories(userId);
  const categoryOf = async (userId: string, name: string) => (await categoryRepository.findByUserId(userId)).find((category) => category.name === name)!;
  const ideaReactionRepository = new InMemoryIdeaReactionRepository();
  return {
    setReaction: createSetIdeaReaction({ ideaReactionRepository, categoryRepository, catalog, clock: { now: () => now } }),
    listReactions: createListIdeaReactions(ideaReactionRepository),
    categoryOf,
    advance: (date: Date) => (now = date),
  };
}

describe("reacciones a una idea: guardar, hecha, descartar (RF-19)", () => {
  it("guarda una idea de una categoría propia, con su fecha", async () => {
    const { setReaction, listReactions, categoryOf } = await setup();
    const economy = await categoryOf("ana", "Economía");

    const result = await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: "saved" });

    expect(result.ok).toBe(true);
    expect(await listReactions("ana")).toEqual({ ok: true, value: [{ categoryId: economy.id, templateKey: "economia.2", reaction: "saved", reactedAt: new Date("2026-10-12T10:00:00Z") }] });
  });

  it("una idea tiene una sola reacción: la nueva sustituye a la anterior", async () => {
    const { setReaction, listReactions, categoryOf, advance } = await setup();
    const economy = await categoryOf("ana", "Economía");
    await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: "saved" });
    advance(new Date("2026-10-13T10:00:00Z"));

    await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: "done" });

    const listed = await listReactions("ana");
    expect(listed.ok && listed.value).toEqual([{ categoryId: economy.id, templateKey: "economia.2", reaction: "done", reactedAt: new Date("2026-10-13T10:00:00Z") }]);
  });

  it("sin reacción (null) la quita; quitar la que no existe no falla", async () => {
    const { setReaction, listReactions, categoryOf } = await setup();
    const economy = await categoryOf("ana", "Economía");
    await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: "discarded" });

    expect((await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: null })).ok).toBe(true);
    expect((await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.3", reaction: null })).ok).toBe(true);

    expect(await listReactions("ana")).toEqual({ ok: true, value: [] });
  });

  it("solo sobre una categoría propia", async () => {
    const { setReaction, categoryOf } = await setup();
    const notMine = await categoryOf("luis", "Economía");

    const result = await setReaction({ userId: "ana", categoryId: notMine.id, templateKey: "economia.2", reaction: "saved" });

    expect(!result.ok && result.error.code).toBe("NOT_FOUND");
  });

  it("solo ideas del catálogo de esa categoría: ni de otra, ni inventadas, ni una reacción desconocida", async () => {
    const { setReaction, categoryOf } = await setup();
    const economy = await categoryOf("ana", "Economía");

    const otherCategory = await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "familia.1", reaction: "saved" });
    const invented = await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.99", reaction: "saved" });
    const badReaction = await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.2", reaction: "liked" as never });

    for (const result of [otherCategory, invented, badReaction]) expect(!result.ok && result.error.code).toBe("VALIDATION_ERROR");
  });

  it("cada persona ve solo las suyas, la más reciente primero", async () => {
    const { setReaction, listReactions, categoryOf, advance } = await setup();
    const economy = await categoryOf("ana", "Economía");
    const family = await categoryOf("ana", "Familia");
    await setReaction({ userId: "ana", categoryId: economy.id, templateKey: "economia.1", reaction: "saved" });
    advance(new Date("2026-10-13T10:00:00Z"));
    await setReaction({ userId: "ana", categoryId: family.id, templateKey: "familia.3", reaction: "saved" });
    await setReaction({ userId: "luis", categoryId: (await categoryOf("luis", "Economía")).id, templateKey: "economia.1", reaction: "discarded" });

    const listed = await listReactions("ana");

    expect(listed.ok && listed.value.map((reaction) => reaction.templateKey)).toEqual(["familia.3", "economia.1"]);
  });
});
