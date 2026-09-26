import { describe, expect, it } from "vitest";
import { createGetLatestScores } from "@modules/assessments/application/GetLatestScores";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

async function setup() {
  let ahora = new Date("2026-09-19T10:00:00Z");
  const reloj: Clock = { now: () => ahora };
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const listado = await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  if (!listado.ok) throw new Error("setup falló");
  const [a, b, c] = listado.value;
  await categoryRepository.save({ ...a, status: "active" });
  await categoryRepository.save({ ...b, status: "active" });
  const record = createRecordAssessments(assessmentRepository, categoryRepository, reloj);
  const getLatestScores = createGetLatestScores(assessmentRepository, categoryRepository);
  return { record, getLatestScores, a, b, c, avanzar: (d: Date) => (ahora = d) };
}

async function setupWithEnglish(categoryId: string) {
  const categoryRepository = new InMemoryCategoryRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  await categoryRepository.save({ id: categoryId, userId: "u1", name: "Economía", description: "d", nameEn: "Finances (custom)", descriptionEn: "d", type: "standard", status: "active", isSensitiveData: false });
  return { getLatestScores: createGetLatestScores(assessmentRepository, categoryRepository) };
}

describe("GetLatestScores (RF-10, consulta de resultados)", () => {
  it("devuelve cada categoría activa sin puntuar todavía con score undefined", async () => {
    const { getLatestScores, a, b } = await setup();

    const resultado = await getLatestScores("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.map((r) => r.categoryId).sort()).toEqual([a.id, b.id].sort());
      expect(resultado.value.every((r) => r.score === undefined)).toBe(true);
    }
  });

  it("devuelve la última puntuación de cada categoría, con su fecha y nota", async () => {
    const { record, getLatestScores, a, avanzar } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 3, note: "mal mes" }] });
    avanzar(new Date("2026-09-26T10:00:00Z"));
    await record({ userId: "u1", entries: [{ categoryId: a.id, score: 8 }] });

    const resultado = await getLatestScores("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      const fila = resultado.value.find((r) => r.categoryId === a.id)!;
      expect(fila.score).toBe(8);
      expect(fila.note).toBeUndefined();
      expect(fila.recordedAt?.toISOString()).toBe("2026-09-26T10:00:00.000Z");
      expect(fila.categoryName).toBe(a.name);
    }
  });

  it("no incluye categorías inactivas ni de otros usuarios", async () => {
    const { getLatestScores, c } = await setup();

    const resultado = await getLatestScores("u1");
    const otro = await getLatestScores("u2");

    expect(resultado.ok && resultado.value.some((r) => r.categoryId === c.id)).toBe(false);
    expect(otro.ok && otro.value).toEqual([]);
  });

  it("rechaza un userId vacío", async () => {
    const { getLatestScores } = await setup();

    const resultado = await getLatestScores("");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("incluye el nombre en inglés cuando la categoría lo tiene (categorías creadas por el admin)", async () => {
    const { a } = await setup();
    const withEnglish = await setupWithEnglish(a.id);

    const resultado = await withEnglish.getLatestScores("u1");

    expect(resultado.ok && resultado.value.find((r) => r.categoryId === a.id)?.categoryNameEn).toBe("Finances (custom)");
  });
});
