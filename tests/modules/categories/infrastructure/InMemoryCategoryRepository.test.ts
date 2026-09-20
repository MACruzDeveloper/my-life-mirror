import { describe, expect, it } from "vitest";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Category } from "@modules/categories/domain/Category";

function createCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "c1",
    userId: "u1",
    name: "Economía",
    description: "...",
    type: "standard",
    status: "inactive",
    isSensitiveData: false,
    ...overrides,
  };
}

describe("InMemoryCategoryRepository", () => {
  it("no encuentra nada antes de guardar", async () => {
    const repo = new InMemoryCategoryRepository();

    expect(await repo.findByUserId("u1")).toEqual([]);
    expect(await repo.findById("u1", "c1")).toBeUndefined();
  });

  it("guarda y encuentra por usuario y por id", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.save(createCategory());

    expect(await repo.findByUserId("u1")).toHaveLength(1);
    expect((await repo.findById("u1", "c1"))?.name).toBe("Economía");
  });

  it("no mezcla categorías de usuarios distintos", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.save(createCategory({ id: "c1", userId: "u1" }));
    await repo.save(createCategory({ id: "c1", userId: "u2", name: "Otra" }));

    expect((await repo.findById("u1", "c1"))?.name).toBe("Economía");
    expect((await repo.findById("u2", "c1"))?.name).toBe("Otra");
  });

  it("saveMany guarda varias de una vez", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.saveMany([createCategory({ id: "c1" }), createCategory({ id: "c2", name: "Deporte" })]);

    expect(await repo.findByUserId("u1")).toHaveLength(2);
  });

  it("guardar de nuevo sobrescribe (upsert)", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.save(createCategory({ status: "inactive" }));

    await repo.save(createCategory({ status: "active" }));

    expect((await repo.findById("u1", "c1"))?.status).toBe("active");
  });

  it("deactivateByName desactiva esa categoría en todos los usuarios y no toca las demás", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.saveMany([
      createCategory({ id: "a", userId: "u1", name: "Economía", status: "active" }),
      createCategory({ id: "b", userId: "u2", name: "Economía", status: "active" }),
      createCategory({ id: "c", userId: "u1", name: "Pareja", status: "active" }),
    ]);

    await repo.deactivateByName("Economía");

    expect((await repo.findById("u1", "a"))?.status).toBe("inactive");
    expect((await repo.findById("u2", "b"))?.status).toBe("inactive");
    expect((await repo.findById("u1", "c"))?.status).toBe("active");
  });

  it("deleteByUserId borra las categorías de ese usuario y no las de los demás (RF-05)", async () => {
    const repo = new InMemoryCategoryRepository();
    await repo.saveMany([createCategory({ id: "a", userId: "u1" }), createCategory({ id: "b", userId: "u2" })]);

    await repo.deleteByUserId("u1");

    expect(await repo.findByUserId("u1")).toEqual([]);
    expect(await repo.findByUserId("u2")).toHaveLength(1);
  });
});
