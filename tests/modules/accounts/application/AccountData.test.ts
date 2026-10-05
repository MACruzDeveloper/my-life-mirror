import { describe, expect, it } from "vitest";
import { createDeleteAccount } from "@modules/accounts/application/DeleteAccount";
import { createExportUserData } from "@modules/accounts/application/ExportUserData";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { InMemoryExperienceRepository } from "@modules/assessments/infrastructure/InMemoryExperienceRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { createGrantConsent } from "@modules/consent/application/GrantConsent";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";
import { InMemoryPersonalizedIdeaRepository } from "@modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { AuthenticationError, ConflictError, ValidationError } from "@shared/domain/DomainError";
import type { Clock } from "@shared/domain/Clock";

const clock: Clock = { now: () => new Date("2026-09-20T10:00:00Z") };

async function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const consentRepository = new InMemoryConsentRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const recommendationRepository = new InMemoryRecommendationRepository();
  const personalizedIdeaRepository = new InMemoryPersonalizedIdeaRepository();
  const experienceRepository = new InMemoryExperienceRepository();
  const ports = { authProvider, profileRepository, categoryRepository, consentRepository: consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository };

  const ana = await authProvider.register("ana@ejemplo.com", "12345678");
  const luis = await authProvider.register("luis@ejemplo.com", "abcdefgh");
  const updateProfile = createUpdateProfile(profileRepository);
  await updateProfile({ userId: ana.id, name: "Ana", birthDate: "1996-05-20", timeZone: "Europe/Madrid" });
  await updateProfile({ userId: luis.id, name: "Luis" });

  const listCategories = createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository());
  const recordAssessments = createRecordAssessments(assessmentRepository, categoryRepository, clock);
  const categoriesAna = (await listCategories(ana.id)).ok ? await categoryRepository.findByUserId(ana.id) : [];
  const categoriesLuis = (await listCategories(luis.id)).ok ? await categoryRepository.findByUserId(luis.id) : [];
  const financesAna = categoriesAna.find((c) => c.name === "Economía")!;
  const sexAna = categoriesAna.find((c) => c.name === "Sexo")!;
  await categoryRepository.save({ ...financesAna, status: "active", experienceTags: ["economia.presupuesto"], difficultyTags: ["mirarMisCuentas"] });
  await categoryRepository.save({ ...sexAna, status: "active" });
  await categoryRepository.save({ ...categoriesLuis[0], status: "active" });
  await recordAssessments({ userId: ana.id, entries: [{ categoryId: financesAna.id, score: 6, note: "mes justo" }, { categoryId: sexAna.id, score: 8 }] });
  await recordAssessments({ userId: luis.id, entries: [{ categoryId: categoriesLuis[0].id, score: 3 }] });
  await recommendationRepository.saveMany([
    { id: "r-ana", userId: ana.id, categoryId: financesAna.id, templateKey: "economia.1", threshold: 5, status: "pending", createdAt: clock.now() },
    { id: "r-luis", userId: luis.id, categoryId: categoriesLuis[0].id, templateKey: "general.1", threshold: 5, status: "pending", createdAt: clock.now() },
  ]);
  await personalizedIdeaRepository.save({ recommendationId: "r-ana", userId: ana.id, locale: "es", templateKey: "economia.3", text: "Una idea personalizada de prueba para Ana, con suficiente longitud.", experienceTags: [], model: "fake", createdAt: clock.now() });
  await experienceRepository.save({ id: "e-ana", userId: ana.id, categoryId: financesAna.id, text: "Este mes he ahorrado un poco", createdAt: new Date("2026-09-21T10:00:00.000Z") });
  await profileRepository.save({ ...(await profileRepository.findByUserId(ana.id))!, aiIdeasEnabled: true, aiIdeasEnabledAt: "2026-09-20T10:00:00.000Z" });
  await createGrantConsent(consentRepository, clock)({ userId: ana.id, categoryId: sexAna.id, policyVersion: "2026-09" });

  return {
    ...ports,
    ana,
    luis,
    exportUserData: createExportUserData({ ...ports, clock: clock }),
    deleteAccount: createDeleteAccount(ports),
  };
}

describe("ExportUserData (RF-05 / RNF-12)", () => {
  it("incluye cuenta, perfil, categorías, consentimientos y evaluaciones con nombres, y la fecha y versión del formato", async () => {
    const { exportUserData, ana } = await setup();

    const result = await exportUserData({ id: ana.id, email: ana.email });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value;
    expect(data.schemaVersion).toBe(1);
    expect(data.exportedAt).toBe("2026-09-20T10:00:00.000Z");
    expect(data.account).toEqual({ id: ana.id, email: "ana@ejemplo.com" });
    expect(data.profile).toEqual({ name: "Ana", birthDate: "1996-05-20", timeZone: "Europe/Madrid" });
    expect(data.categories.find((c) => c.name === "Economía")).toMatchObject({ status: "active", isSensitiveData: false, experienceTags: ["economia.presupuesto"], difficultyTags: ["mirarMisCuentas"] });
    expect(data.assessments).toEqual(
      expect.arrayContaining([
        { category: "Economía", score: 6, note: "mes justo", recordedAt: "2026-09-20T10:00:00.000Z" },
        { category: "Sexo", score: 8, recordedAt: "2026-09-20T10:00:00.000Z" },
      ]),
    );
    expect(data.recommendations).toEqual([{ category: "Economía", templateKey: "economia.1", status: "pending", createdAt: "2026-09-20T10:00:00.000Z" }]);
    expect(data.consents).toEqual([{ category: "Sexo", policyVersion: "2026-09", grantedAt: "2026-09-20T10:00:00.000Z" }]);
    // RF-40: la elección y las ideas personalizadas también son datos suyos.
    expect(data.aiIdeas).toEqual({ enabled: true, enabledAt: "2026-09-20T10:00:00.000Z" });
    expect(data.experiences).toEqual([{ category: "Economía", text: "Este mes he ahorrado un poco", createdAt: "2026-09-21T10:00:00.000Z" }]);
    expect(data.personalizedIdeas).toEqual([{ category: "Economía", locale: "es", templateKey: "economia.3", text: "Una idea personalizada de prueba para Ana, con suficiente longitud.", model: "fake", createdAt: "2026-09-20T10:00:00.000Z" }]);
  });

  it("no incluye nada de otros usuarios", async () => {
    const { exportUserData, ana, luis } = await setup();

    const result = await exportUserData({ id: ana.id, email: ana.email });

    const text = JSON.stringify(result.ok ? result.value : {});
    expect(text).not.toContain(luis.id);
    expect(text).not.toContain("luis@ejemplo.com");
    expect(result.ok && result.value.assessments.some((a) => a.score === 3)).toBe(false);
  });

  it("sin perfil ni datos devuelve un documento válido con listas vacías", async () => {
    const { exportUserData, authProvider } = await setup();
    const draft = await authProvider.register("nuevo@ejemplo.com", "12345678");

    const result = await exportUserData({ id: draft.id, email: draft.email });

    expect(result.ok && result.value.profile).toBeNull();
    expect(result.ok && result.value.categories).toEqual([]);
    expect(result.ok && result.value.assessments).toEqual([]);
    expect(result.ok && result.value.consents).toEqual([]);
    expect(result.ok && result.value.recommendations).toEqual([]);
  });
});

describe("DeleteAccount (RF-05, derecho al olvido)", () => {
  it("con la contraseña correcta borra evaluaciones, categorías, consentimientos, perfil y la cuenta de acceso", async () => {
    const { deleteAccount, ana, authProvider, assessmentRepository, categoryRepository, consentRepository, profileRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository } = await setup();

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(result.ok).toBe(true);
    expect(await recommendationRepository.findByUserId(ana.id)).toEqual([]);
    expect(await personalizedIdeaRepository.findByUserId(ana.id)).toEqual([]);
    expect(await experienceRepository.findByUserId(ana.id)).toEqual([]);
    expect(await assessmentRepository.findByUserId(ana.id)).toEqual([]);
    expect(await categoryRepository.findByUserId(ana.id)).toEqual([]);
    expect(await consentRepository.findByUser(ana.id)).toEqual([]);
    expect(await profileRepository.findByUserId(ana.id)).toBeUndefined();
    await expect(authProvider.logIn("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("con una contraseña incorrecta se rechaza y no se borra nada", async () => {
    const { deleteAccount, ana, authProvider, assessmentRepository, profileRepository } = await setup();

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "equivocada" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(AuthenticationError);
    expect((await assessmentRepository.findByUserId(ana.id)).length).toBeGreaterThan(0);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
    await expect(authProvider.logIn("ana@ejemplo.com", "12345678")).resolves.toBeDefined();
  });

  it("una contraseña vacía es un error de validación y no borra nada", async () => {
    const { deleteAccount, ana, profileRepository } = await setup();

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
  });

  it("la contraseña de otro usuario no sirve para borrar esta cuenta", async () => {
    const { deleteAccount, ana, profileRepository } = await setup();

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "abcdefgh" });

    expect(result.ok).toBe(false);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
  });

  it("los datos y la cuenta de los demás usuarios quedan intactos", async () => {
    const { deleteAccount, ana, luis, authProvider, assessmentRepository, categoryRepository, profileRepository, recommendationRepository } = await setup();

    await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect((await assessmentRepository.findByUserId(luis.id)).length).toBe(1);
    expect(await recommendationRepository.findByUserId(luis.id)).toHaveLength(1);
    expect((await categoryRepository.findByUserId(luis.id)).length).toBeGreaterThan(0);
    expect(await profileRepository.findByUserId(luis.id)).toBeDefined();
    await expect(authProvider.logIn("luis@ejemplo.com", "abcdefgh")).resolves.toBeDefined();
  });

  it("si falla el borrado de la cuenta de acceso, los pasos son repetibles y el reintento lo completa", async () => {
    const { ana, authProvider, deleteAccount } = await setup();
    let failures = 1;
    const original = authProvider.deleteUser.bind(authProvider);
    authProvider.deleteUser = async (id: string) => {
      if (failures-- > 0) throw new Error("Supabase no responde");
      return original(id);
    };

    await expect(deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" })).rejects.toThrow();
    const retry = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(retry.ok).toBe(true);
    await expect(authProvider.logIn("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("el único administrador no puede eliminar su cuenta: siempre debe existir uno", async () => {
    const { deleteAccount, ana, authProvider, profileRepository } = await setup();
    authProvider.assignRoleForTest("ana@ejemplo.com", "admin");

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ConflictError);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
    await expect(authProvider.logIn("ana@ejemplo.com", "12345678")).resolves.toBeDefined();
  });

  it("un administrador sí puede eliminar su cuenta si existe otro administrador", async () => {
    const { deleteAccount, ana, authProvider } = await setup();
    authProvider.assignRoleForTest("ana@ejemplo.com", "admin");
    authProvider.assignRoleForTest("luis@ejemplo.com", "admin");

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(result.ok).toBe(true);
    await expect(authProvider.logIn("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("la protección del último administrador se aplica antes de pedir la contraseña", async () => {
    const { deleteAccount, ana, authProvider } = await setup();
    authProvider.assignRoleForTest("ana@ejemplo.com", "admin");

    const result = await deleteAccount({ userId: ana.id, email: ana.email, password: "contraseña-mal" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ConflictError);
  });
});
