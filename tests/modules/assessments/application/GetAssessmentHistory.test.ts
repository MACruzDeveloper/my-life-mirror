import { describe, expect, it } from "vitest";
import { createGetAssessmentHistory } from "@modules/assessments/application/GetAssessmentHistory";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

async function setup() {
  let ahora = new Date("2026-01-15T10:00:00Z");
  const reloj: Clock = { now: () => ahora };
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listado = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listado.ok) throw new Error("setup falló");
  const [a, b] = listado.value;
  await categoryRepository.save({ ...a, status: "active" });
  await categoryRepository.save({ ...b, status: "active" });
  return {
    record: createRecordAssessments(assessmentRepository, categoryRepository, reloj),
    history: createGetAssessmentHistory(assessmentRepository, categoryRepository),
    categoryRepository,
    a,
    b,
    avanzar: (d: Date) => (ahora = d),
  };
}

describe("GetAssessmentHistory (RF-10, historial de cambios)", () => {
  it("sin nada guardado devuelve una lista vacía", async () => {
    const { history } = await setup();

    const resultado = await history("u1");

    expect(resultado.ok && resultado.value).toEqual([]);
  });

  it("agrupa por momento de guardado, del más reciente al más antiguo", async () => {
    const { record, history, a, b, avanzar } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }, { categoryId: b.id, score: 7 }] });
    avanzar(new Date("2026-09-18T10:00:00Z"));
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 4, note: "mes justo" }] });

    const resultado = await history("u1");

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value).toHaveLength(2);
    expect(resultado.value[0].recordedAt).toEqual(new Date("2026-09-18T10:00:00Z"));
    expect(resultado.value[0].entries).toEqual([
      { categoryId: a.id, catalogId: a.catalogId, categoryName: a.name, score: 4, previousScore: 6, note: "mes justo" },
    ]);
    expect(resultado.value[1].entries.map((e) => e.score).sort()).toEqual([6, 7]);
    expect(resultado.value[1].entries.every((e) => e.previousScore === undefined)).toBe(true);
  });

  it("sigue mostrando el nombre de una categoría ya desactivada", async () => {
    const { record, history, categoryRepository, a } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }] });
    await categoryRepository.save({ ...a, status: "inactive" });

    const resultado = await history("u1");

    expect(resultado.ok && resultado.value[0].entries[0].categoryName).toBe(a.name);
  });

  it("rechaza un usuario vacío", async () => {
    const { history } = await setup();

    expect((await history("  ")).ok).toBe(false);
  });

  it("cada entrada lleva el id de catálogo de su categoría", async () => {
    const { record, history, a } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 6 }] });

    const resultado = await history("u1");

    expect(resultado.ok && resultado.value[0].entries[0].catalogId).toBe(a.catalogId);
  });
});
