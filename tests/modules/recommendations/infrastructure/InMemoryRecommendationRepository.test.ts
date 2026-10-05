import { describe, expect, it } from "vitest";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import type { Recommendation } from "@modules/recommendations/domain/Recommendation";

function rec(overrides: Partial<Recommendation> = {}): Recommendation {
  return { id: "r1", userId: "u1", categoryId: "c1", templateKey: "economia.1", threshold: 5, status: "pending", createdAt: new Date("2026-09-20T10:00:00Z"), ...overrides };
}

describe("InMemoryRecommendationRepository", () => {
  it("guarda y devuelve solo las del usuario; guardar con el mismo id actualiza (cambio de estado)", async () => {
    const repo = new InMemoryRecommendationRepository();
    await repo.saveMany([rec({ id: "a" }), rec({ id: "b", userId: "u2" })]);
    await repo.saveMany([rec({ id: "a", status: "done" })]);

    const ofUser = await repo.findByUserId("u1");

    expect(ofUser).toHaveLength(1);
    expect(ofUser[0].status).toBe("done");
  });

  it("deleteByUserId borra las de ese usuario y no las de los demás (RF-05)", async () => {
    const repo = new InMemoryRecommendationRepository();
    await repo.saveMany([rec({ id: "a" }), rec({ id: "b", userId: "u2" })]);

    await repo.deleteByUserId("u1");

    expect(await repo.findByUserId("u1")).toEqual([]);
    expect(await repo.findByUserId("u2")).toHaveLength(1);
  });
});
