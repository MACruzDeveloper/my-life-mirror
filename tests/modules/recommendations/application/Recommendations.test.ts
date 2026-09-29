import { describe, expect, it } from "vitest";
import { createGenerateRecommendations } from "@modules/recommendations/application/GenerateRecommendations";
import { createListRecommendations } from "@modules/recommendations/application/ListRecommendations";
import { templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

const THRESHOLD = 5;

async function setup() {
  let ahora = new Date("2026-09-20T10:00:00Z");
  const clock: Clock = { now: () => ahora };
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const recommendationRepository = new InMemoryRecommendationRepository();
  await createListCategories(categoryRepository, catalog)("u1");
  const categorias = await categoryRepository.findByUserId("u1");
  const economia = categorias.find((c) => c.name === "Economía")!;
  const deporte = categorias.find((c) => c.name === "Deporte")!;
  await categoryRepository.save({ ...economia, status: "active" });
  await categoryRepository.save({ ...deporte, status: "active" });

  const generate = createGenerateRecommendations({ recommendationRepository, categoryRepository, catalog, clock, threshold: THRESHOLD });
  const list = createListRecommendations({ recommendationRepository, categoryRepository, assessmentRepository });
  const record = createRecordAssessments(assessmentRepository, categoryRepository, clock, (userId, guardadas) => generate(userId, guardadas));
  return { generate, list, record, recommendationRepository, categoryRepository, assessmentRepository, economia, deporte, avanzar: (d: Date) => (ahora = d) };
}

describe("GenerateRecommendations (RF-18)", () => {
  it("crea una recomendación pendiente, de la categoría, cuando la puntuación está por debajo del umbral", async () => {
    const { record, recommendationRepository, economia } = await setup();

    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });

    const guardadas = await recommendationRepository.findByUserId("u1");
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0]).toMatchObject({ userId: "u1", categoryId: economia.id, status: "pending", threshold: THRESHOLD });
    expect(templateKeysFor("economia")).toContain(guardadas[0].templateKey);
  });

  it("no crea nada con una puntuación igual o superior al umbral", async () => {
    const { record, recommendationRepository, economia } = await setup();

    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 5 }] });
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 9 }] });

    expect(await recommendationRepository.findByUserId("u1")).toEqual([]);
  });

  it("solo crea para las categorías bajas de un mismo guardado", async () => {
    const { record, recommendationRepository, economia, deporte } = await setup();

    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 2 }, { categoryId: deporte.id, score: 8 }] });

    const guardadas = await recommendationRepository.findByUserId("u1");
    expect(guardadas.map((r) => r.categoryId)).toEqual([economia.id]);
  });

  it("no acumula: si ya hay una abierta para esa categoría, otra puntuación baja no crea más", async () => {
    const { record, recommendationRepository, economia } = await setup();

    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 2 }] });

    expect(await recommendationRepository.findByUserId("u1")).toHaveLength(1);
  });

  it("al generar otra tras cerrar la anterior elige una plantilla que aún no había recibido, y repite al agotarlas", async () => {
    const { generate, record, recommendationRepository, economia } = await setup();
    const claves = templateKeysFor("economia");
    const cerrar = async () => {
      for (const r of await recommendationRepository.findByUserId("u1")) await recommendationRepository.saveMany([{ ...r, status: "done" }]);
    };

    const recibidas: string[] = [];
    for (let i = 0; i < claves.length; i++) {
      await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 2 }] });
      const abiertas = (await recommendationRepository.findByUserId("u1")).filter((r) => r.status === "pending");
      recibidas.push(abiertas[0].templateKey);
      await cerrar();
    }
    expect(new Set(recibidas).size).toBe(claves.length);

    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 2 }] });
    const nueva = (await recommendationRepository.findByUserId("u1")).filter((r) => r.status === "pending");
    expect(nueva[0].templateKey).toBe(claves[0]);
    void generate;
  });

  it("una categoría sin plantillas propias usa las generales", async () => {
    const { generate, recommendationRepository, categoryRepository } = await setup();
    await categoryRepository.save({ id: "custom", userId: "u1", name: "Creatividad", description: "d", type: "standard", status: "active", isSensitiveData: false });

    await generate("u1", [{ id: "a", userId: "u1", categoryId: "custom", score: 1, recordedAt: new Date() }]);

    const [r] = await recommendationRepository.findByUserId("u1");
    expect(r.templateKey.startsWith("general.")).toBe(true);
  });

  it("ignora una categoría inactiva o inexistente sin fallar", async () => {
    const { generate, recommendationRepository } = await setup();

    const resultado = await generate("u1", [{ id: "a", userId: "u1", categoryId: "no-existe", score: 1, recordedAt: new Date() }]);

    expect(resultado.ok).toBe(true);
    expect(await recommendationRepository.findByUserId("u1")).toEqual([]);
  });
});

describe("RecordAssessments avisa al oyente después de guardar (RF-18)", () => {
  it("un fallo del oyente no deshace el guardado", async () => {
    const { categoryRepository, assessmentRepository, economia } = await setup();
    const record = createRecordAssessments(assessmentRepository, categoryRepository, { now: () => new Date() }, async () => {
      throw new Error("fallo en el generador");
    });

    const resultado = await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 2 }] });

    expect(resultado.ok).toBe(true);
    expect(await assessmentRepository.findByUserId("u1")).toHaveLength(1);
  });

  it("no avisa si el guardado se rechaza", async () => {
    const { categoryRepository, assessmentRepository } = await setup();
    let avisos = 0;
    const record = createRecordAssessments(assessmentRepository, categoryRepository, { now: () => new Date() }, async () => {
      avisos++;
    });

    const resultado = await record({ userId: "u1", entries: [{ categoryId: "no-existe", score: 2 }] });

    expect(resultado.ok).toBe(false);
    expect(avisos).toBe(0);
  });
});

describe("ListRecommendations (RF-18)", () => {
  it("devuelve las abiertas de categorías activas cuya última puntuación sigue bajo el umbral, con el nombre", async () => {
    const { record, list, economia } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });

    const resultado = await list("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toHaveLength(1);
      expect(resultado.value[0]).toMatchObject({ categoryId: economia.id, categoryName: "Economía", status: "pending" });
    }
  });

  it("deja de mostrarla cuando la puntuación mejora (el registro se conserva)", async () => {
    const { record, list, recommendationRepository, economia, avanzar } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });
    avanzar(new Date("2026-09-27T10:00:00Z"));
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 8 }] });

    const resultado = await list("u1");

    expect(resultado.ok && resultado.value).toEqual([]);
    expect(await recommendationRepository.findByUserId("u1")).toHaveLength(1);
  });

  it("no la muestra si la categoría se desactiva", async () => {
    const { record, list, categoryRepository, economia } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });
    await categoryRepository.save({ ...economia, status: "inactive" });

    const resultado = await list("u1");

    expect(resultado.ok && resultado.value).toEqual([]);
  });

  it("no muestra las cerradas (hecha/descartada) y rechaza un usuario vacío", async () => {
    const { record, list, recommendationRepository, economia } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });
    const [r] = await recommendationRepository.findByUserId("u1");
    await recommendationRepository.saveMany([{ ...r, status: "discarded" }]);

    expect((await list("u1")).ok && (await list("u1"))).toMatchObject({ value: [] });
    expect((await list(" ")).ok).toBe(false);
  });
});

describe("ListRecommendations — identidad de la categoría", () => {
  it("lleva el id de catálogo de la categoría, para que la interfaz busque su nombre en cada idioma", async () => {
    const { record, list, economia } = await setup();
    await record({ userId: "u1", entries: [{ categoryId: economia.id, score: 3 }] });

    const resultado = await list("u1");

    expect(resultado.ok && resultado.value[0].catalogId).toBe(economia.catalogId);
  });
});
