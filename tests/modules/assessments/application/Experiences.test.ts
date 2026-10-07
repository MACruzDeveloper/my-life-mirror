import { describe, expect, it } from "vitest";
import { createAddExperience, createDeleteExperience, createListExperiences } from "@modules/assessments/application/Experiences";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { InMemoryExperienceRepository } from "@modules/assessments/infrastructure/InMemoryExperienceRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import type { Clock } from "@shared/domain/Clock";

async function setup() {
  let now = new Date("2026-10-05T10:00:00Z");
  const clock: Clock = { now: () => now };
  const categoryRepository = new InMemoryCategoryRepository();
  await createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository())("u1");
  const finances = (await categoryRepository.findByUserId("u1")).find((category) => category.name === "Economía")!;
  const experienceRepository = new InMemoryExperienceRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  return {
    add: createAddExperience({ experienceRepository, categoryRepository, clock }),
    list: createListExperiences(experienceRepository),
    remove: createDeleteExperience({ experienceRepository, assessmentRepository }),
    assessmentRepository,
    experienceRepository,
    finances,
    advance: (date: Date) => (now = date),
  };
}

describe("diario de experiencias (RF-44)", () => {
  it("añade una experiencia a una categoría del usuario, sin necesidad de puntuar, con el texto limpio y la fecha", async () => {
    const { add, finances } = await setup();

    const result = await add({ userId: "u1", categoryId: finances.id, text: "  Este mes he ahorrado un poco  " });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({ userId: "u1", categoryId: finances.id, text: "Este mes he ahorrado un poco", createdAt: new Date("2026-10-05T10:00:00Z") });
  });

  it("rechaza una experiencia vacía o de más de 500 caracteres", async () => {
    const { add, finances } = await setup();

    for (const text of ["   ", "x".repeat(501)]) {
      const result = await add({ userId: "u1", categoryId: finances.id, text });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("una categoría que no es del usuario no existe para él", async () => {
    const { add, finances } = await setup();

    const result = await add({ userId: "otro", categoryId: finances.id, text: "algo" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("lista las del usuario, la más reciente primero, y nunca las de otro", async () => {
    const { add, list, finances, advance, experienceRepository } = await setup();
    await add({ userId: "u1", categoryId: finances.id, text: "primera" });
    advance(new Date("2026-10-06T10:00:00Z"));
    await add({ userId: "u1", categoryId: finances.id, text: "segunda" });
    await experienceRepository.save({ id: "ajena", userId: "otro", categoryId: "c-otro", text: "de otro", createdAt: new Date() });

    const result = await list("u1");

    expect(result.ok && result.value.map((experience) => experience.text)).toEqual(["segunda", "primera"]);
  });

  it("borra una experiencia propia; la de otro usuario no existe para él", async () => {
    const { add, list, remove, finances } = await setup();
    const added = await add({ userId: "u1", categoryId: finances.id, text: "para borrar" });
    if (!added.ok) throw new Error("setup");

    expect((await remove({ userId: "otro", experienceId: added.value.id })).ok).toBe(false);
    expect((await remove({ userId: "u1", experienceId: added.value.id })).ok).toBe(true);
    expect((await list("u1")).ok && (await list("u1"))).toMatchObject({ value: [] });
  });

  it("borrar una que venía de una nota antigua vacía también esa nota en su evaluación (derecho al olvido), sin tocar la puntuación", async () => {
    const { remove, experienceRepository, assessmentRepository, finances } = await setup();
    const recordedAt = new Date("2026-09-01T10:00:00Z");
    await assessmentRepository.saveMany([
      { id: "a-old", userId: "u1", categoryId: finances.id, score: 4, note: "Mes justo", recordedAt },
      { id: "a-other", userId: "u1", categoryId: finances.id, score: 6, note: "Otra nota", recordedAt },
    ]);
    await experienceRepository.save({ id: "e-old", userId: "u1", categoryId: finances.id, text: "Mes justo", createdAt: recordedAt, sourceAssessmentId: "a-old" });

    expect((await remove({ userId: "u1", experienceId: "e-old" })).ok).toBe(true);

    const assessments = await assessmentRepository.findByUserId("u1");
    expect(assessments.find((assessment) => assessment.id === "a-old")).toEqual({ id: "a-old", userId: "u1", categoryId: finances.id, score: 4, recordedAt });
    expect(assessments.find((assessment) => assessment.id === "a-other")?.note).toBe("Otra nota");
  });

  it("exige usuario", async () => {
    const { list } = await setup();

    expect((await list(" ")).ok).toBe(false);
  });
});
