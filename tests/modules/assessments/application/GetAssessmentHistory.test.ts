import { describe, expect, it } from "vitest";
import { createGetAssessmentHistory } from "@modules/assessments/application/GetAssessmentHistory";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

async function setup() {
  let now = new Date("2026-01-15T10:00:00Z");
  const clock: Clock = { now: () => now };
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listed = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listed.ok) throw new Error("setup falló");
  const [a, b] = listed.value;
  await categoryRepository.save({ ...a, status: "active" });
  await categoryRepository.save({ ...b, status: "active" });
  return {
    record: createRecordAssessments(assessmentRepository, categoryRepository, clock),
    history: createGetAssessmentHistory(assessmentRepository, categoryRepository),
    categoryRepository,
    a,
    b,
    advance: (d: Date) => (now = d),
  };
}

describe("GetAssessmentHistory (RF-10, historial de cambios)", () => {
  it("sin nada guardado devuelve una lista vacía", async () => {
    const { history } = await setup();

    const result = await history("u1");

    expect(result.ok && result.value).toEqual([]);
  });

  it("agrupa por momento de guardado, del más reciente al más antiguo", async () => {
    const { record, history, a, b, advance: avanzar } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }, { categoryId: b.id, score: 7 }] });
    avanzar(new Date("2026-09-18T10:00:00Z"));
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 4, note: "mes justo" }] });

    const result = await history("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0].recordedAt).toEqual(new Date("2026-09-18T10:00:00Z"));
    expect(result.value[0].entries).toEqual([
      { categoryId: a.id, catalogId: a.catalogId, categoryName: a.name, score: 4, previousScore: 6, note: "mes justo" },
    ]);
    expect(result.value[1].entries.map((e) => e.score).sort()).toEqual([6, 7]);
    expect(result.value[1].entries.every((e) => e.previousScore === undefined)).toBe(true);
  });

  it("sigue mostrando el nombre de una categoría ya desactivada", async () => {
    const { record, history, categoryRepository, a } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }] });
    await categoryRepository.save({ ...a, status: "inactive" });

    const result = await history("u1");

    expect(result.ok && result.value[0].entries[0].categoryName).toBe(a.name);
  });

  it("rechaza un usuario vacío", async () => {
    const { history } = await setup();

    expect((await history("  ")).ok).toBe(false);
  });

  it("cada entrada lleva el id de catálogo de su categoría", async () => {
    const { record, history, a } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }] });

    const result = await history("u1");

    expect(result.ok && result.value[0].entries[0].catalogId).toBe(a.catalogId);
  });
});
