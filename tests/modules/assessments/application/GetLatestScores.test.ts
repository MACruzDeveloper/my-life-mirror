import { describe, expect, it } from "vitest";
import { createGetLatestScores } from "@modules/assessments/application/GetLatestScores";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

async function setup() {
  let now = new Date("2026-09-19T10:00:00Z");
  const clock: Clock = { now: () => now };
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listed = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listed.ok) throw new Error("setup falló");
  const [a, b, c] = listed.value;
  await categoryRepository.save({ ...a, status: "active" });
  await categoryRepository.save({ ...b, status: "active" });
  const record = createRecordAssessments(assessmentRepository, categoryRepository, clock);
  const getLatestScores = createGetLatestScores(assessmentRepository, categoryRepository);
  return { record, getLatestScores, a, b, c, advance: (d: Date) => (now = d) };
}

describe("GetLatestScores (RF-10, consulta de resultados)", () => {
  it("devuelve cada categoría activa sin puntuar todavía con score undefined", async () => {
    const { getLatestScores, a, b } = await setup();

    const result = await getLatestScores("u1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((r) => r.categoryId).sort()).toEqual([a.id, b.id].sort());
      expect(result.value.every((r) => r.score === undefined)).toBe(true);
    }
  });

  it("devuelve la última puntuación de cada categoría, con su fecha y nota", async () => {
    const { record, getLatestScores, a, advance: avanzar } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 3, note: "mal mes" }] });
    avanzar(new Date("2026-09-26T10:00:00Z"));
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 8 }] });

    const result = await getLatestScores("u1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const row = result.value.find((r) => r.categoryId === a.id)!;
      expect(row.score).toBe(8);
      expect(row.note).toBeUndefined();
      expect(row.recordedAt?.toISOString()).toBe("2026-09-26T10:00:00.000Z");
      expect(row.categoryName).toBe(a.name);
    }
  });

  it("no incluye categorías inactivas ni de otros usuarios", async () => {
    const { getLatestScores, c } = await setup();

    const result = await getLatestScores("u1");
    const other = await getLatestScores("u2");

    expect(result.ok && result.value.some((r) => r.categoryId === c.id)).toBe(false);
    expect(other.ok && other.value).toEqual([]);
  });

  it("rechaza un userId vacío", async () => {
    const { getLatestScores } = await setup();

    const result = await getLatestScores("");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("cada resultado lleva el id de catálogo de su categoría (la interfaz nombra por id, en cada idioma)", async () => {
    const { getLatestScores, a } = await setup();

    const result = await getLatestScores("u1");

    expect(result.ok && result.value.find((r) => r.categoryId === a.id)?.catalogId).toBe(a.catalogId);
    expect(a.catalogId).toBeDefined();
  });
});
