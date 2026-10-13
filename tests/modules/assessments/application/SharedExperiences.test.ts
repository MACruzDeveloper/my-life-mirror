import { describe, expect, it } from "vitest";
import { createAddExperience } from "@modules/assessments/application/Experiences";
import {
  createListSharedExperiences,
  createReportSharedExperience,
  createShareExperience,
  createUnshareExperience,
} from "@modules/assessments/application/SharedExperiences";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { InMemoryExperienceRepository } from "@modules/assessments/infrastructure/InMemoryExperienceRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { CatalogCategory } from "@modules/categories/domain/CatalogCategory";
import type { Clock } from "@shared/domain/Clock";

async function setup({ extraCatalogCategory }: { extraCatalogCategory?: CatalogCategory } = {}) {
  let now = new Date("2026-10-05T10:00:00Z");
  const clock: Clock = { now: () => now };
  const categoryRepository = new InMemoryCategoryRepository();
  const catalog = new InMemoryCategoryCatalogRepository();
  if (extraCatalogCategory) await catalog.save(extraCatalogCategory);
  const listCategories = createListCategories(categoryRepository, catalog);
  for (const userId of ["autora", "lectora", "otra"]) await listCategories(userId);
  const categoryOf = async (userId: string, name: string) => (await categoryRepository.findByUserId(userId)).find((category) => category.name === name)!;
  const experienceRepository = new InMemoryExperienceRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const add = createAddExperience({ experienceRepository, categoryRepository, clock });

  /** Una experiencia de `userId` en `name`, con esa última puntuación (o sin puntuar). */
  async function experience(userId: string, name: string, text: string, score?: number) {
    const category = await categoryOf(userId, name);
    if (score !== undefined) await assessmentRepository.saveMany([{ id: `${userId}-${name}-${now.getTime()}`, userId, categoryId: category.id, score, recordedAt: now }]);
    const result = await add({ userId, categoryId: category.id, text });
    if (!result.ok) throw result.error;
    return result.value;
  }

  return {
    share: createShareExperience({ experienceRepository, categoryRepository, catalog, assessmentRepository, clock }),
    unshare: createUnshareExperience(experienceRepository),
    listShared: createListSharedExperiences({ experienceRepository, categoryRepository, catalog }),
    report: createReportSharedExperience({ experienceRepository, clock }),
    experience,
    categoryOf,
    assessmentRepository,
    experienceRepository,
    advance: (date: Date) => (now = date),
  };
}

describe("compartir una experiencia (RF-43)", () => {
  it("con 8 o más en la categoría, la comparte con su idioma y la clave de la categoría del catálogo", async () => {
    const { share, experience } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos cada domingo", 8);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({ id: saved.id, sharedAt: new Date("2026-10-05T10:00:00Z"), sharedLocale: "es", sharedCategoryKey: "economia" });
  });

  it("cuenta la última puntuación, no la mejor", async () => {
    const { share, experience, assessmentRepository, categoryOf, advance } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos cada domingo", 9);
    advance(new Date("2026-10-06T10:00:00Z"));
    await assessmentRepository.saveMany([{ id: "baja", userId: "autora", categoryId: (await categoryOf("autora", "Economía")).id, score: 6, recordedAt: new Date("2026-10-06T10:00:00Z") }]);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "score" });
  });

  it("sin puntuar o con menos de 8, no se puede compartir", async () => {
    const { share, experience } = await setup();
    for (const score of [undefined, 7]) {
      const saved = await experience("autora", "Economía", "Apunto los gastos", score);
      const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "score" });
    }
  });

  it("nunca en una categoría sensible ni excluida de la IA (Pareja)", async () => {
    const { share, experience } = await setup();
    for (const name of ["Sexo", "Pareja"]) {
      const saved = await experience("autora", name, "Algo que me funciona", 9);
      const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });
      expect(result.ok, name).toBe(false);
      if (!result.ok) expect(result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "category" });
    }
  });

  it("no publica un texto que no pasa los filtros, y dice por qué", async () => {
    const { share, experience } = await setup();
    const saved = await experience("autora", "Economía", "Dejé la medicación y ahorré", 9);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "health" });
  });

  it("Deporte ya no es sensible: se puede compartir", async () => {
    const { share, experience } = await setup();
    const saved = await experience("autora", "Deporte", "Salir a caminar después de cenar", 9);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok && result.value.sharedCategoryKey).toBe("deporte");
  });

  // Fallo real (12 oct.): "Idiomas", añadida desde administración, no tiene clave de catálogo, y la
  // app la dejaba fuera de compartir sin decir nada. Con 8 no aparecía ni el aviso ni el botón.
  it("una categoría añadida desde administración (sin clave) también se puede compartir, y otra persona la lee", async () => {
    const languages: CatalogCategory = { id: "catalogo-idiomas", translations: { es: { name: "Idiomas", description: "Aprender y practicar idiomas." } }, isSensitiveData: false };
    const { share, listShared, experience, categoryOf } = await setup({ extraCatalogCategory: languages });
    const saved = await experience("autora", "Idiomas", "Veo series en versión original con subtítulos", 8);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok).toBe(true);
    const read = await listShared({ userId: "lectora", categoryId: (await categoryOf("lectora", "Idiomas")).id, locale: "es" });
    expect(read).toEqual({ ok: true, value: [{ id: saved.id, text: "Veo series en versión original con subtítulos" }] });
    // Y no se mezcla con las de otra categoría.
    const other = await listShared({ userId: "lectora", categoryId: (await categoryOf("lectora", "Economía")).id, locale: "es" });
    expect(other).toEqual({ ok: true, value: [] });
  });

  it("una categoría sensible añadida desde administración sigue sin poder compartirse", async () => {
    const health: CatalogCategory = { id: "catalogo-salud", translations: { es: { name: "Salud", description: "Cómo te encuentras." } }, isSensitiveData: true };
    const { share, experience } = await setup({ extraCatalogCategory: health });
    const saved = await experience("autora", "Salud", "Duermo mejor desde que ceno pronto", 9);

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(!result.ok && result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "category" });
  });

  it("una experiencia reportada no se puede volver a compartir", async () => {
    const { share, unshare, report, experience } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos", 9);
    await share({ userId: "autora", experienceId: saved.id, locale: "es" });
    await report({ userId: "lectora", experienceId: saved.id });
    await unshare({ userId: "autora", experienceId: saved.id });

    const result = await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "NOT_SHAREABLE", reason: "reported" });
  });

  it("solo la de uno mismo, y en un idioma soportado", async () => {
    const { share, experience } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos", 9);

    const notMine = await share({ userId: "otra", experienceId: saved.id, locale: "es" });
    const badLocale = await share({ userId: "autora", experienceId: saved.id, locale: "fr" });

    expect(notMine.ok).toBe(false);
    if (!notMine.ok) expect(notMine.error.code).toBe("NOT_FOUND");
    expect(badLocale.ok).toBe(false);
    if (!badLocale.ok) expect(badLocale.error.code).toBe("VALIDATION_ERROR");
  });

  it("dejar de compartir la quita de lo compartido y conserva la experiencia", async () => {
    const { share, unshare, experience, experienceRepository } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos", 9);
    await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    const result = await unshare({ userId: "autora", experienceId: saved.id });

    expect(result.ok).toBe(true);
    const [stored] = await experienceRepository.findByUserId("autora");
    expect(stored).toMatchObject({ id: saved.id, text: "Apunto los gastos" });
    expect(stored.sharedAt).toBeUndefined();
    expect((await unshare({ userId: "otra", experienceId: saved.id })).ok).toBe(false);
  });
});

describe("leer y reportar lo que comparten otras personas (RF-43)", () => {
  it("la lectora ve solo el texto de las compartidas de su misma categoría y su idioma, la más reciente primero", async () => {
    const { share, listShared, experience, categoryOf, advance } = await setup();
    const first = await experience("autora", "Economía", "Apunto los gastos cada domingo", 9);
    await share({ userId: "autora", experienceId: first.id, locale: "es" });
    advance(new Date("2026-10-06T10:00:00Z"));
    const second = await experience("otra", "Economía", "Una hucha para los imprevistos", 8);
    await share({ userId: "otra", experienceId: second.id, locale: "es" });
    const english = await experience("otra", "Economía", "A budget app helps", 8);
    await share({ userId: "otra", experienceId: english.id, locale: "en" });
    const otherCategory = await experience("otra", "Familia", "Cenamos juntos", 9);
    await share({ userId: "otra", experienceId: otherCategory.id, locale: "es" });
    await experience("otra", "Economía", "Esta no la comparto", 9);

    const result = await listShared({ userId: "lectora", categoryId: (await categoryOf("lectora", "Economía")).id, locale: "es" });

    expect(result).toEqual({
      ok: true,
      value: [
        { id: second.id, text: "Una hucha para los imprevistos" },
        { id: first.id, text: "Apunto los gastos cada domingo" },
      ],
    });
  });

  it("nunca enseña las propias", async () => {
    const { share, listShared, experience, categoryOf } = await setup();
    const own = await experience("autora", "Economía", "Apunto los gastos", 9);
    await share({ userId: "autora", experienceId: own.id, locale: "es" });

    const result = await listShared({ userId: "autora", categoryId: (await categoryOf("autora", "Economía")).id, locale: "es" });

    expect(result).toEqual({ ok: true, value: [] });
  });

  it("como mucho 10", async () => {
    const { share, listShared, experience, categoryOf } = await setup();
    for (let index = 0; index < 12; index++) {
      const saved = await experience("autora", "Economía", `Idea número ${index}`, 9);
      await share({ userId: "autora", experienceId: saved.id, locale: "es" });
    }

    const result = await listShared({ userId: "lectora", categoryId: (await categoryOf("lectora", "Economía")).id, locale: "es" });

    expect(result.ok && result.value).toHaveLength(10);
  });

  it("con una categoría que no es suya, nada", async () => {
    const { listShared, categoryOf } = await setup();

    const result = await listShared({ userId: "lectora", categoryId: (await categoryOf("otra", "Economía")).id, locale: "es" });

    expect(result).toEqual({ ok: true, value: [] });
  });

  it("un reporte la oculta para todos; no se puede reportar la propia, una no compartida ni dos veces", async () => {
    const { share, report, listShared, experience, categoryOf, experienceRepository } = await setup();
    const saved = await experience("autora", "Economía", "Apunto los gastos", 9);
    const privateOne = await experience("autora", "Economía", "Privada", 9);
    await share({ userId: "autora", experienceId: saved.id, locale: "es" });

    expect((await report({ userId: "autora", experienceId: saved.id })).ok).toBe(false);
    expect((await report({ userId: "lectora", experienceId: privateOne.id })).ok).toBe(false);
    expect(await report({ userId: "lectora", experienceId: saved.id })).toEqual({ ok: true, value: true });
    expect((await report({ userId: "otra", experienceId: saved.id })).ok).toBe(false);

    for (const userId of ["lectora", "otra"]) {
      expect(await listShared({ userId, categoryId: (await categoryOf(userId, "Economía")).id, locale: "es" })).toEqual({ ok: true, value: [] });
    }
    const stored = (await experienceRepository.findByUserId("autora")).find((experience) => experience.id === saved.id);
    expect(stored?.reportedAt).toEqual(new Date("2026-10-05T10:00:00Z"));
  });
});
