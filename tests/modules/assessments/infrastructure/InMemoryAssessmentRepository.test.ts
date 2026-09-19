import { describe, expect, it } from "vitest";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import type { Assessment } from "@modules/assessments/domain/Assessment";

function assessment(overrides: Partial<Assessment> = {}): Assessment {
  return {
    id: "a1",
    userId: "u1",
    categoryId: "c1",
    score: 7,
    recordedAt: new Date("2026-09-19T10:00:00Z"),
    ...overrides,
  };
}

describe("InMemoryAssessmentRepository", () => {
  it("no devuelve nada si no hay evaluaciones", async () => {
    expect(await new InMemoryAssessmentRepository().findByUserId("u1")).toEqual([]);
  });

  it("guarda varias de una vez y las devuelve solo para su usuario", async () => {
    const repo = new InMemoryAssessmentRepository();
    await repo.saveMany([assessment({ id: "a1" }), assessment({ id: "a2", categoryId: "c2" }), assessment({ id: "a3", userId: "u2" })]);

    const delUsuario = await repo.findByUserId("u1");

    expect(delUsuario.map((a) => a.id).sort()).toEqual(["a1", "a2"]);
  });

  it("no sobrescribe: guardar otra evaluación de la misma categoría añade, no reemplaza (registro inmutable)", async () => {
    const repo = new InMemoryAssessmentRepository();
    await repo.saveMany([assessment({ id: "a1", score: 3 })]);
    await repo.saveMany([assessment({ id: "a2", score: 8 })]);

    expect(await repo.findByUserId("u1")).toHaveLength(2);
  });
});
