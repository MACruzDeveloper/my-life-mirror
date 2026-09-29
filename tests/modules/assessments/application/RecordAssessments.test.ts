import { describe, expect, it } from "vitest";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

const AHORA = new Date("2026-09-19T10:00:00Z");
const reloj: Clock = { now: () => AHORA };

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listado = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listado.ok) throw new Error("setup falló");
  const [primera, segunda, tercera] = listado.value;
  await categoryRepository.save({ ...primera, status: "active" });
  await categoryRepository.save({ ...segunda, status: "active" });
  const recordAssessments = createRecordAssessments(assessmentRepository, categoryRepository, reloj);
  return { recordAssessments, assessmentRepository, activa1: primera, activa2: segunda, inactiva: tercera };
}

describe("RecordAssessments (RF-10)", () => {
  it("guarda una evaluación por puntuación, con el mismo momento de registro", async () => {
    const { recordAssessments, assessmentRepository, activa1, activa2 } = await setup();

    const resultado = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 4 },
        { categoryId: activa2.id, score: 9, note: "  buen mes  " },
      ],
    });

    expect(resultado.ok).toBe(true);
    const guardadas = await assessmentRepository.findByUserId("u1");
    expect(guardadas).toHaveLength(2);
    expect(guardadas.every((a) => a.recordedAt.getTime() === AHORA.getTime())).toBe(true);
    expect(guardadas.find((a) => a.categoryId === activa2.id)?.note).toBe("buen mes");
    expect(guardadas.find((a) => a.categoryId === activa1.id)?.note).toBeUndefined();
  });

  it("puntuar de nuevo más tarde añade registros, no edita los anteriores", async () => {
    const { recordAssessments, assessmentRepository, activa1 } = await setup();

    await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 3 }] });
    await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 8 }] });

    expect((await assessmentRepository.findByUserId("u1")).map((a) => a.score).sort()).toEqual([3, 8]);
  });

  it.each([0, 11, 5.5])("rechaza todo el check-in si una puntuación es inválida (%s), sin guardar nada", async (score) => {
    const { recordAssessments, assessmentRepository, activa1, activa2 } = await setup();

    const resultado = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 7 },
        { categoryId: activa2.id, score },
      ],
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
    expect(await assessmentRepository.findByUserId("u1")).toEqual([]);
  });

  it("rechaza una categoría inactiva (CONFLICT), sin guardar nada", async () => {
    const { recordAssessments, assessmentRepository, activa1, inactiva } = await setup();

    const resultado = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 7 },
        { categoryId: inactiva.id, score: 5 },
      ],
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("CONFLICT");
    expect(await assessmentRepository.findByUserId("u1")).toEqual([]);
  });

  it("rechaza una categoría que no existe o no es del usuario (NOT_FOUND)", async () => {
    const { recordAssessments, activa1 } = await setup();

    const inexistente = await recordAssessments({ userId: "u1", entries: [{ categoryId: "no-existe", score: 5 }] });
    const ajena = await recordAssessments({ userId: "otro-usuario", entries: [{ categoryId: activa1.id, score: 5 }] });

    for (const resultado of [inexistente, ajena]) {
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.error.code).toBe("NOT_FOUND");
    }
  });

  it("rechaza la misma categoría dos veces en un check-in", async () => {
    const { recordAssessments, activa1 } = await setup();

    const resultado = await recordAssessments({
      userId: "u1",
      entries: [
        { categoryId: activa1.id, score: 5 },
        { categoryId: activa1.id, score: 6 },
      ],
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una nota de más de 500 caracteres y trata la vacía como sin nota", async () => {
    const { recordAssessments, assessmentRepository, activa1, activa2 } = await setup();

    const larga = await recordAssessments({ userId: "u1", entries: [{ categoryId: activa1.id, score: 5, note: "x".repeat(501) }] });
    const vacia = await recordAssessments({ userId: "u1", entries: [{ categoryId: activa2.id, score: 5, note: "   " }] });

    expect(larga.ok).toBe(false);
    expect(vacia.ok).toBe(true);
    expect((await assessmentRepository.findByUserId("u1"))[0].note).toBeUndefined();
  });

  it("rechaza userId vacío o una lista vacía", async () => {
    const { recordAssessments, activa1 } = await setup();

    const sinUsuario = await recordAssessments({ userId: "", entries: [{ categoryId: activa1.id, score: 5 }] });
    const sinEntradas = await recordAssessments({ userId: "u1", entries: [] });

    for (const resultado of [sinUsuario, sinEntradas]) {
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
