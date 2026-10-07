import { describe, expect, it } from "vitest";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { createPersonalizeRecommendation } from "@modules/recommendations/application/PersonalizeRecommendation";
import type { IdeaDraft, IdeaRequest, IdeaReviewer, IdeaWriter } from "@modules/recommendations/domain/IdeaWriter";
import { FakeIdeaWriter } from "@modules/recommendations/infrastructure/FakeIdeaWriter";
import { InMemoryPersonalizedIdeaRepository } from "@modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { JsonIdeaTexts } from "@modules/recommendations/infrastructure/JsonIdeaTexts";
import type { Clock } from "@shared/domain/Clock";

const clock: Clock = { now: () => new Date("2026-10-02T09:00:00Z") };

/** Escritor de prueba: cuenta llamadas, guarda la petición y devuelve lo que se le diga. */
class ScriptedWriter implements IdeaWriter {
  readonly model = "scripted";
  calls: IdeaRequest[] = [];
  private readonly answer: (request: IdeaRequest) => Promise<IdeaDraft>;
  constructor(answer: (request: IdeaRequest) => Promise<IdeaDraft>) {
    this.answer = answer;
  }
  async write(request: IdeaRequest): Promise<IdeaDraft> {
    this.calls.push(request);
    return this.answer(request);
  }
}

const approve: IdeaReviewer = { review: async () => ({ approved: true, reasons: [] }) };

async function setup(options: { writer?: IdeaWriter; reviewer?: IdeaReviewer; aiIdeasEnabled?: boolean; available?: boolean } = {}) {
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  const listed = await createListCategories(categoryRepository, catalog)("u1");
  if (!listed.ok) throw new Error("setup falló");
  const entries = await catalog.findAll();
  const byKey = (key: string) => listed.value.find((c) => c.catalogId === entries.find((e) => e.key === key)?.id)!;
  const finances = byKey("economia");
  const spirituality = byKey("espiritualidad");
  const couple = byKey("pareja");
  const family = byKey("familia");
  await categoryRepository.save({ ...couple, status: "active" });
  // RF-42: "Contacto con la familia" choca con todas las ideas de Familia: se ofrecen las generales.
  await categoryRepository.save({ ...family, status: "active", difficultyTags: ["contactoConFamilia"] });
  await categoryRepository.save({ ...finances, status: "active", experienceTags: ["economia.presupuesto"] });
  await categoryRepository.save({ ...spirituality, status: "active" });

  const profileRepository = new InMemoryProfileRepository();
  await profileRepository.save({ userId: "u1", name: "Ana", aiIdeasEnabled: options.aiIdeasEnabled ?? true });

  const assessmentRepository = new InMemoryAssessmentRepository();
  await assessmentRepository.saveMany([
    { id: "a1", userId: "u1", categoryId: finances.id, score: 6, recordedAt: new Date("2026-09-01T10:00:00Z") },
    { id: "a2", userId: "u1", categoryId: finances.id, score: 3, note: "texto privado que nunca debe salir", recordedAt: new Date("2026-10-01T10:00:00Z") },
    { id: "a3", userId: "u1", categoryId: spirituality.id, score: 2, recordedAt: new Date("2026-10-01T10:00:00Z") },
    { id: "a4", userId: "u1", categoryId: couple.id, score: 2, recordedAt: new Date("2026-10-01T10:00:00Z") },
    { id: "a5", userId: "u1", categoryId: family.id, score: 2, recordedAt: new Date("2026-10-01T10:00:00Z") },
  ]);

  const recommendationRepository = new InMemoryRecommendationRepository();
  await recommendationRepository.saveMany([
    { id: "r-finances", userId: "u1", categoryId: finances.id, templateKey: "economia.1", threshold: 5, status: "pending", createdAt: clock.now() },
    { id: "r-spirituality", userId: "u1", categoryId: spirituality.id, templateKey: "espiritualidad.1", threshold: 5, status: "pending", createdAt: clock.now() },
    { id: "r-couple", userId: "u1", categoryId: couple.id, templateKey: "pareja.1", threshold: 5, status: "pending", createdAt: clock.now() },
    { id: "r-family", userId: "u1", categoryId: family.id, templateKey: "familia.1", threshold: 5, status: "pending", createdAt: clock.now() },
    { id: "r-done", userId: "u1", categoryId: finances.id, templateKey: "economia.2", threshold: 5, status: "done", createdAt: clock.now() },
  ]);

  const personalizedIdeaRepository = new InMemoryPersonalizedIdeaRepository();
  const writer = options.writer ?? new FakeIdeaWriter();
  const personalize = createPersonalizeRecommendation({
    recommendationRepository,
    categoryRepository,
    catalog,
    assessmentRepository,
    profileRepository,
    personalizedIdeaRepository,
    ideaTexts: new JsonIdeaTexts(),
    writer: options.available === false ? undefined : writer,
    reviewer: options.reviewer ?? approve,
    clock,
    timeoutMs: 50,
  });
  return { personalize, writer, personalizedIdeaRepository, categoryRepository, finances };
}

describe("PersonalizeRecommendation (RF-40)", () => {
  it("con todo activado, devuelve una idea de IA anclada al catálogo y la guarda", async () => {
    const { personalize, personalizedIdeaRepository } = await setup();

    const result = await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });

    expect(result.ok).toBe(true);
    if (!result.ok || result.value.source !== "ai") throw new Error("se esperaba una idea de IA");
    expect(result.value.templateKey).toBe("economia.1");
    expect(result.value.text.length).toBeGreaterThan(40);
    expect(await personalizedIdeaRepository.find("r-finances", "economia.1", "es")).toMatchObject({ userId: "u1", model: "fake", experienceTags: ["economia.presupuesto"] });
  });

  it("a la IA solo le llega lo necesario: clave, puntuación, tendencia, opciones marcadas y la idea a reescribir; nunca la nota privada", async () => {
    const writer = new ScriptedWriter(async (request) => ({ templateKey: request.candidates[0].templateKey, text: "Como llevar un presupuesto te ayuda, prueba a anotar tus gastos una semana, sin juzgarte." }));
    const { personalize } = await setup({ writer });

    await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });

    expect(writer.calls).toHaveLength(1);
    const request = writer.calls[0];
    expect(request).toMatchObject({ locale: "es", categoryKey: "economia", score: 3, trend: "down", helpfulThings: ["Llevar un presupuesto"] });
    expect(request.candidates.map((candidate) => candidate.templateKey)).toEqual(["economia.1"]);
    expect(JSON.stringify(request)).not.toMatch(/texto privado|Ana|u1|r-finances/);
  });

  it("la segunda vez lee la idea guardada sin volver a llamar al escritor", async () => {
    const writer = new ScriptedWriter(async (request) => ({ templateKey: request.candidates[0].templateKey, text: "Prueba a apartar una cantidad pequeña nada más cobrar, aunque sea simbólica." }));
    const { personalize } = await setup({ writer });

    const first = await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });
    const second = await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });

    expect(writer.calls).toHaveLength(1);
    expect(second).toEqual(first);
  });

  it("con templateKey (el carrusel, UX-05) reescribe esa idea y la guarda aparte de las demás", async () => {
    const writer = new ScriptedWriter(async (request) => ({ templateKey: request.candidates[0].templateKey, text: "Una versión personalizada de la tercera idea, con la longitud suficiente." }));
    const { personalize, personalizedIdeaRepository } = await setup({ writer });

    const third = await personalize({ userId: "u1", recommendationId: "r-finances", templateKey: "economia.3", locale: "es" });
    await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });

    expect(third).toEqual({ ok: true, value: { source: "ai", templateKey: "economia.3", text: "Una versión personalizada de la tercera idea, con la longitud suficiente." } });
    expect(writer.calls.map((request) => request.candidates.map((candidate) => candidate.templateKey))).toEqual([["economia.3"], ["economia.1"]]);
    expect((await personalizedIdeaRepository.findByUserId("u1")).map((idea) => idea.templateKey).sort()).toEqual(["economia.1", "economia.3"]);
  });

  it("si cambian las opciones de '¿Qué te ayuda?', la idea guardada se reescribe con las nuevas (RF-40 v1.1)", async () => {
    const writer = new ScriptedWriter(async (request) => ({ templateKey: request.candidates[0].templateKey, text: `Idea pensada para: ${request.helpfulThings.join(", ") || "nada"}, sin prisa.` }));
    const { personalize, categoryRepository, finances } = await setup({ writer });

    await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });
    await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });
    await categoryRepository.save({ ...(await categoryRepository.findById("u1", finances.id))!, experienceTags: ["economia.presupuesto", "economia.apps"] });
    const rewritten = await personalize({ userId: "u1", recommendationId: "r-finances", locale: "es" });

    expect(writer.calls).toHaveLength(2);
    expect(writer.calls[1].helpfulThings).toEqual(["Llevar un presupuesto", "Apps de finanzas"]);
    if (!rewritten.ok || rewritten.value.source !== "ai") throw new Error("se esperaba una idea de IA");
    expect(rewritten.value.text).toContain("Apps de finanzas");
  });

  it("una idea que no es del catálogo de esa categoría se rechaza", async () => {
    const { personalize } = await setup();

    const result = await personalize({ userId: "u1", recommendationId: "r-finances", templateKey: "deporte.1", locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("si todas las ideas de la categoría chocan, acepta las generales que ofrece el carrusel (RF-42)", async () => {
    const { personalize } = await setup();

    const general = await personalize({ userId: "u1", recommendationId: "r-family", templateKey: "general.2", locale: "es" });
    const own = await personalize({ userId: "u1", recommendationId: "r-family", templateKey: "familia.2", locale: "es" });

    expect(general.ok && general.value.templateKey).toBe("general.2");
    expect(own.ok).toBe(false);
  });

  it("una idea que choca con lo que se lo pone difícil se rechaza, tampoco se personaliza (RF-42)", async () => {
    const writer = new ScriptedWriter(async (request) => ({ templateKey: request.candidates[0].templateKey, text: "Una idea que no debería llegar a escribirse nunca, ni personalizada." }));
    const { personalize, categoryRepository, finances } = await setup({ writer });
    await categoryRepository.save({ ...(await categoryRepository.findById("u1", finances.id))!, difficultyTags: ["apuntarYRegistrar"] });

    const result = await personalize({ userId: "u1", recommendationId: "r-finances", templateKey: "economia.4", locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(writer.calls).toHaveLength(0);
  });

  it("sin IA, la idea pedida del carrusel se devuelve como curada", async () => {
    const { personalize } = await setup({ aiIdeasEnabled: false });

    const result = await personalize({ userId: "u1", recommendationId: "r-finances", templateKey: "economia.4", locale: "es" });

    expect(result).toEqual({ ok: true, value: { source: "catalog", templateKey: "economia.4" } });
  });

  const catalogCases: [string, Parameters<typeof setup>[0], string][] = [
    ["el usuario no lo ha activado", { aiIdeasEnabled: false }, "r-finances"],
    ["no hay proveedor configurado", { available: false }, "r-finances"],
    ["la categoría es sensible (Espiritualidad)", {}, "r-spirituality"],
    ["la categoría está excluida de la IA (Pareja)", {}, "r-couple"],
    ["la recomendación ya no está abierta", {}, "r-done"],
    ["el escritor falla", { writer: new ScriptedWriter(async () => Promise.reject(new Error("caído"))) }, "r-finances"],
    ["el escritor tarda demasiado", { writer: new ScriptedWriter(() => new Promise((resolve) => setTimeout(() => resolve({ templateKey: "economia.1", text: "x".repeat(60) }), 500))) }, "r-finances"],
    ["el borrador no pasa el filtro", { writer: new ScriptedWriter(async () => ({ templateKey: "economia.1", text: "Tienes que anotar en qué se va tu dinero durante una semana entera, sin excusas." })) }, "r-finances"],
    ["el borrador elige una idea que no es de la categoría", { writer: new ScriptedWriter(async () => ({ templateKey: "deporte.1", text: "Sal a caminar veinte minutos hoy: empezar en pequeño es mejor que no empezar." })) }, "r-finances"],
    ["el revisor no lo aprueba", { reviewer: { review: async () => ({ approved: false, reasons: ["tono"] }) } }, "r-finances"],
  ];
  for (const [name, options, recommendationId] of catalogCases) {
    it(`texto curado si ${name}`, async () => {
      const { personalize, personalizedIdeaRepository } = await setup(options);

      const result = await personalize({ userId: "u1", recommendationId, locale: "es" });

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.source).toBe("catalog");
      expect(await personalizedIdeaRepository.findByUserId("u1")).toEqual([]);
    });
  }

  it("una recomendación de otro usuario no existe para este", async () => {
    const { personalize } = await setup();

    const result = await personalize({ userId: "otro", recommendationId: "r-finances", locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("un idioma no soportado se rechaza", async () => {
    const { personalize } = await setup();

    const result = await personalize({ userId: "u1", recommendationId: "r-finances", locale: "fr" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });
});
