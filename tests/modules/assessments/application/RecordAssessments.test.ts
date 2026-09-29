import { describe, expect, it } from "vitest";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

const NOW = new Date("2026-09-19T10:00:00Z");
const clock: Clock = { now: () => NOW };

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listed = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listed.ok) throw new Error("setup falló");
  const [first, second, third] = listed.value;
  await categoryRepository.save({ ...first, status: "active" });
  await categoryRepository.save({ ...second, status: "active" });
  const recordAssessments = createRecordAssessments(assessmentRepository, categoryRepository, clock);
  return { recordAssessments, assessmentRepository, active1: first, active2: second, inactive: third };
}

describe("RecordAssessments (RF-10)", () => {
  it("guarda una evaluación por puntuación, con el mismo momento de registro", async () => {
    const { recordAssessments, assessmentRepository, active1: activa1, active2: activa2 } = await setup();

    const result = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 4 },
        { categoryId: activa2.id, score: 9, note: "  buen mes  " },
      ],
    });

    expect(result.ok).toBe(true);
    const saved = await assessmentRepository.findByUserId("u1");
    expect(saved).toHaveLength(2);
    expect(saved.every((a) => a.recordedAt.getTime() === NOW.getTime())).toBe(true);
    expect(saved.find((a) => a.categoryId === activa2.id)?.note).toBe("buen mes");
    expect(saved.find((a) => a.categoryId === activa1.id)?.note).toBeUndefined();
  });

  it("puntuar de nuevo más tarde añade registros, no edita los anteriores", async () => {
    const { recordAssessments, assessmentRepository, active1: activa1 } = await setup();

    await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 3 }] });
    await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 8 }] });

    expect((await assessmentRepository.findByUserId("u1")).map((a) => a.score).sort()).toEqual([3, 8]);
  });

  it.each([0, 11, 5.5])("rechaza todo el check-in si una puntuación es inválida (%s), sin guardar nada", async (score) => {
    const { recordAssessments, assessmentRepository, active1: activa1, active2: activa2 } = await setup();

    const result = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 7 },
        { categoryId: activa2.id, score },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(await assessmentRepository.findByUserId("u1")).toEqual([]);
  });

  it("rechaza una categoría inactiva (CONFLICT), sin guardar nada", async () => {
    const { recordAssessments, assessmentRepository, active1: activa1, inactive: inactiva } = await setup();

    const result = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 7 },
        { categoryId: inactiva.id, score: 5 },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CONFLICT");
    expect(await assessmentRepository.findByUserId("u1")).toEqual([]);
  });

  it("rechaza una categoría que no existe o no es del usuario (NOT_FOUND)", async () => {
    const { recordAssessments, active1: activa1 } = await setup();

    const nonexistent = await recordAssessments({ userId: "u1", entries: [{ categoryId: "no-existe", score: 5 }] });
    const foreign = await recordAssessments({ userId: "otro-usuario", entries: [{ categoryId: activa1.id, score: 5 }] });

    for (const result of [nonexistent, foreign]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("rechaza la misma categoría dos veces en un check-in", async () => {
    const { recordAssessments, active1: activa1 } = await setup();

    const result = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 5 },
        { categoryId: activa1.id, score: 6 },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una nota de más de 500 caracteres y trata la vacía como sin nota", async () => {
    const { recordAssessments, assessmentRepository, active1: activa1, active2: activa2 } = await setup();

    const tooLong = await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 5, note: "x".repeat(501) }] });
    const empty = await recordAssessments({ userId: "u1", entries: [{ categoryId: activa2.id, score: 5, note: "   " }] });

    expect(tooLong.ok).toBe(false);
    expect(empty.ok).toBe(true);
    expect((await assessmentRepository.findByUserId("u1"))[0].note).toBeUndefined();
  });

  it("rechaza userId vacío o una lista vacía", async () => {
    const { recordAssessments, active1: activa1 } = await setup();

    const noUser = await recordAssessments({ userId: "", entries: [{ categoryId: activa1.id, score: 5 }] });
    const noEntries = await recordAssessments({ userId: "u1", entries: [] });

    for (const result of [noUser, noEntries]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
