import { describe, expect, it } from "vitest";
import { createAppContext } from "@shared/infrastructure/container";
import { seedDemoAccount } from "@shared/infrastructure/demo/seedDemoAccount";

const DEMO = { email: "demo@example.com", password: "una-clave-publica" };

/** La app entera en memoria: los mismos casos de uso que en producción. */
async function seeded() {
  const context = createAppContext("test");
  const summary = await seedDemoAccount(context, DEMO);
  return { context, summary };
}

describe("seedDemoAccount (TFM-01): la cuenta de prueba de la entrega", () => {
  it("crea la cuenta con seis áreas activas, un año de historial, tres ideas abiertas, opciones, diario e IA activada", async () => {
    const { context, summary } = await seeded();

    const session = await context.logIn({ email: DEMO.email, password: DEMO.password });
    expect(session.ok).toBe(true);
    const userId = summary.demoUserId;

    const categories = await context.listCategories(userId);
    const active = categories.ok ? categories.value.filter((category) => category.status === "active") : [];
    expect(active).toHaveLength(6);
    expect(active.every((category) => !category.isSensitiveData)).toBe(true);
    expect(active.filter((category) => (category.experienceTags ?? []).length > 0).length).toBeGreaterThanOrEqual(4);
    expect(active.filter((category) => (category.difficultyTags ?? []).length > 0).length).toBeGreaterThanOrEqual(2);

    // 12 meses de historial más la evaluación de hoy, por área.
    const assessments = await context.assessmentRepository.findByUserId(userId);
    expect(assessments).toHaveLength(6 * 13);
    const oldest = Math.min(...assessments.map((assessment) => assessment.recordedAt.getTime()));
    expect(Date.now() - oldest).toBeGreaterThan(330 * 24 * 60 * 60 * 1000);

    const recommendations = await context.listRecommendations(userId);
    expect(recommendations.ok && recommendations.value).toHaveLength(3);

    const experiences = await context.listExperiences(userId);
    expect(experiences.ok && experiences.value.length).toBe(5);
    expect(new Set(experiences.ok ? experiences.value.map((experience) => experience.createdAt.toISOString().slice(0, 10)) : []).size).toBe(5);
    expect(experiences.ok && experiences.value.some((experience) => experience.sharedAt)).toBe(false);

    const profile = await context.getProfile(userId);
    expect(profile.ok && profile.value).toMatchObject({ aiIdeasEnabled: true, aiSuggestionsEnabled: true });
  });

  it("tiene un área con 8 o más y una experiencia sin compartir, para probar 'Compartir de forma anónima'", async () => {
    const { context, summary } = await seeded();
    const latest = await context.getLatestScores(summary.demoUserId);
    const high = latest.ok ? latest.value.filter((score) => (score.score ?? 0) >= 8) : [];
    expect(high.length).toBeGreaterThanOrEqual(1);

    const experiences = await context.listExperiences(summary.demoUserId);
    const shareable = experiences.ok ? experiences.value.find((experience) => high.some((score) => score.categoryId === experience.categoryId)) : undefined;
    expect(shareable).toBeDefined();
    const shared = await context.shareExperience({ userId: summary.demoUserId, experienceId: shareable!.id, locale: "es" });
    expect(shared.ok).toBe(true);
  });

  it("en cada área con idea abierta ve experiencias de 'otra persona', en español y en inglés", async () => {
    const { context, summary } = await seeded();
    const recommendations = await context.listRecommendations(summary.demoUserId);
    const categoryIds = recommendations.ok ? recommendations.value.map((recommendation) => recommendation.categoryId) : [];
    expect(categoryIds).toHaveLength(3);

    for (const categoryId of categoryIds) {
      for (const locale of ["es", "en"]) {
        const shared = await context.listSharedExperiences({ userId: summary.demoUserId, categoryId, locale });
        expect(shared.ok && shared.value.length, `${categoryId} ${locale}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("volver a ejecutarlo deja las dos cuentas como al principio, sin duplicados, y no toca a nadie más", async () => {
    const context = createAppContext("test");
    const other = await context.registerUser({ email: "real@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "Persona real" });
    const first = await seedDemoAccount(context, DEMO);
    const categories = await context.listCategories(first.demoUserId);
    const anyCategory = categories.ok ? categories.value.find((category) => category.status === "active")! : undefined;
    await context.addExperience({ userId: first.demoUserId, categoryId: anyCategory!.id, text: "Algo que escribió quien la probó" });

    const second = await seedDemoAccount(context, DEMO);

    const users = await context.authProvider.listAllUsers();
    expect(users.map((user) => user.email).sort()).toEqual(["demo-otra-persona@example.com", "demo@example.com", "real@ejemplo.com"]);
    expect(other.ok && users.some((user) => user.id === other.value.id)).toBe(true);
    const experiences = await context.listExperiences(second.demoUserId);
    expect(experiences.ok && experiences.value.length).toBe(5);
    expect(await context.assessmentRepository.findByUserId(first.demoUserId)).toHaveLength(first.demoUserId === second.demoUserId ? 6 * 13 : 0);
  });

  it("exige una contraseña de al menos 8 caracteres (va a ser pública, pero tiene que servir para entrar)", async () => {
    await expect(seedDemoAccount(createAppContext("test"), { email: "demo@example.com", password: "corta" })).rejects.toThrow(/contraseña/i);
  });
});
