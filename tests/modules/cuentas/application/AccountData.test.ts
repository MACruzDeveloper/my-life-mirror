import { describe, expect, it } from "vitest";
import { createDeleteAccount } from "@modules/cuentas/application/DeleteAccount";
import { createExportUserData } from "@modules/cuentas/application/ExportUserData";
import { createUpdateProfile } from "@modules/cuentas/application/UpdateProfile";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";
import { createRecordAssessments } from "@modules/assessments/application/RecordAssessments";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { crearOtorgarConsentimiento } from "@modules/consentimiento/application/OtorgarConsentimiento";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { AuthenticationError, ConflictError, ValidationError } from "@shared/domain/DomainError";
import type { Clock } from "@shared/domain/Clock";

const reloj: Clock = { now: () => new Date("2026-09-20T10:00:00Z") };

async function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const consentimientoRepository = new InMemoryConsentimientoRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const recommendationRepository = new InMemoryRecommendationRepository();
  const puertos = { authProvider, profileRepository, categoryRepository, consentimientoRepository, assessmentRepository, recommendationRepository };

  const ana = await authProvider.registrar("ana@ejemplo.com", "12345678");
  const luis = await authProvider.registrar("luis@ejemplo.com", "abcdefgh");
  const updateProfile = createUpdateProfile(profileRepository);
  await updateProfile({ userId: ana.id, name: "Ana", birthDate: "1996-05-20", timeZone: "Europe/Madrid" });
  await updateProfile({ userId: luis.id, name: "Luis" });

  const listCategories = createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository());
  const recordAssessments = createRecordAssessments(assessmentRepository, categoryRepository, reloj);
  const categoriasAna = (await listCategories(ana.id)).ok ? await categoryRepository.findByUserId(ana.id) : [];
  const categoriasLuis = (await listCategories(luis.id)).ok ? await categoryRepository.findByUserId(luis.id) : [];
  const economiaAna = categoriasAna.find((c) => c.name === "Economía")!;
  const sexoAna = categoriasAna.find((c) => c.name === "Sexo")!;
  await categoryRepository.save({ ...economiaAna, status: "active" });
  await categoryRepository.save({ ...sexoAna, status: "active" });
  await categoryRepository.save({ ...categoriasLuis[0], status: "active" });
  await recordAssessments({ userId: ana.id, entries: [{ categoryId: economiaAna.id, score: 6, note: "mes justo" }, { categoryId: sexoAna.id, score: 8 }] });
  await recordAssessments({ userId: luis.id, entries: [{ categoryId: categoriasLuis[0].id, score: 3 }] });
  await recommendationRepository.saveMany([
    { id: "r-ana", userId: ana.id, categoryId: economiaAna.id, templateKey: "economia.1", threshold: 5, status: "pending", createdAt: reloj.now() },
    { id: "r-luis", userId: luis.id, categoryId: categoriasLuis[0].id, templateKey: "general.1", threshold: 5, status: "pending", createdAt: reloj.now() },
  ]);
  await crearOtorgarConsentimiento(consentimientoRepository, reloj)({ usuarioId: ana.id, categoriaId: sexoAna.id, versionPolitica: "2026-09" });

  return {
    ...puertos,
    ana,
    luis,
    exportUserData: createExportUserData({ ...puertos, clock: reloj }),
    deleteAccount: createDeleteAccount(puertos),
  };
}

describe("ExportUserData (RF-05 / RNF-12)", () => {
  it("incluye cuenta, perfil, categorías, consentimientos y evaluaciones con nombres, y la fecha y versión del formato", async () => {
    const { exportUserData, ana } = await setup();

    const resultado = await exportUserData({ id: ana.id, email: ana.email });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const datos = resultado.value;
    expect(datos.schemaVersion).toBe(1);
    expect(datos.exportedAt).toBe("2026-09-20T10:00:00.000Z");
    expect(datos.account).toEqual({ id: ana.id, email: "ana@ejemplo.com" });
    expect(datos.profile).toEqual({ name: "Ana", birthDate: "1996-05-20", timeZone: "Europe/Madrid" });
    expect(datos.categories.find((c) => c.name === "Economía")).toMatchObject({ status: "active", isSensitiveData: false });
    expect(datos.assessments).toEqual(
      expect.arrayContaining([
        { category: "Economía", score: 6, note: "mes justo", recordedAt: "2026-09-20T10:00:00.000Z" },
        { category: "Sexo", score: 8, recordedAt: "2026-09-20T10:00:00.000Z" },
      ]),
    );
    expect(datos.recommendations).toEqual([{ category: "Economía", templateKey: "economia.1", status: "pending", createdAt: "2026-09-20T10:00:00.000Z" }]);
    expect(datos.consents).toEqual([{ category: "Sexo", policyVersion: "2026-09", grantedAt: "2026-09-20T10:00:00.000Z" }]);
  });

  it("no incluye nada de otros usuarios", async () => {
    const { exportUserData, ana, luis } = await setup();

    const resultado = await exportUserData({ id: ana.id, email: ana.email });

    const texto = JSON.stringify(resultado.ok ? resultado.value : {});
    expect(texto).not.toContain(luis.id);
    expect(texto).not.toContain("luis@ejemplo.com");
    expect(resultado.ok && resultado.value.assessments.some((a) => a.score === 3)).toBe(false);
  });

  it("sin perfil ni datos devuelve un documento válido con listas vacías", async () => {
    const { exportUserData, authProvider } = await setup();
    const nuevo = await authProvider.registrar("nuevo@ejemplo.com", "12345678");

    const resultado = await exportUserData({ id: nuevo.id, email: nuevo.email });

    expect(resultado.ok && resultado.value.profile).toBeNull();
    expect(resultado.ok && resultado.value.categories).toEqual([]);
    expect(resultado.ok && resultado.value.assessments).toEqual([]);
    expect(resultado.ok && resultado.value.consents).toEqual([]);
    expect(resultado.ok && resultado.value.recommendations).toEqual([]);
  });
});

describe("DeleteAccount (RF-05, derecho al olvido)", () => {
  it("con la contraseña correcta borra evaluaciones, categorías, consentimientos, perfil y la cuenta de acceso", async () => {
    const { deleteAccount, ana, authProvider, assessmentRepository, categoryRepository, consentimientoRepository, profileRepository, recommendationRepository } = await setup();

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(resultado.ok).toBe(true);
    expect(await recommendationRepository.findByUserId(ana.id)).toEqual([]);
    expect(await assessmentRepository.findByUserId(ana.id)).toEqual([]);
    expect(await categoryRepository.findByUserId(ana.id)).toEqual([]);
    expect(await consentimientoRepository.buscarPorUsuario(ana.id)).toEqual([]);
    expect(await profileRepository.findByUserId(ana.id)).toBeUndefined();
    await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("con una contraseña incorrecta se rechaza y no se borra nada", async () => {
    const { deleteAccount, ana, authProvider, assessmentRepository, profileRepository } = await setup();

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "equivocada" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(AuthenticationError);
    expect((await assessmentRepository.findByUserId(ana.id)).length).toBeGreaterThan(0);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
    await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).resolves.toBeDefined();
  });

  it("una contraseña vacía es un error de validación y no borra nada", async () => {
    const { deleteAccount, ana, profileRepository } = await setup();

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
  });

  it("la contraseña de otro usuario no sirve para borrar esta cuenta", async () => {
    const { deleteAccount, ana, profileRepository } = await setup();

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "abcdefgh" });

    expect(resultado.ok).toBe(false);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
  });

  it("los datos y la cuenta de los demás usuarios quedan intactos", async () => {
    const { deleteAccount, ana, luis, authProvider, assessmentRepository, categoryRepository, profileRepository, recommendationRepository } = await setup();

    await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect((await assessmentRepository.findByUserId(luis.id)).length).toBe(1);
    expect(await recommendationRepository.findByUserId(luis.id)).toHaveLength(1);
    expect((await categoryRepository.findByUserId(luis.id)).length).toBeGreaterThan(0);
    expect(await profileRepository.findByUserId(luis.id)).toBeDefined();
    await expect(authProvider.iniciarSesion("luis@ejemplo.com", "abcdefgh")).resolves.toBeDefined();
  });

  it("si falla el borrado de la cuenta de acceso, los pasos son repetibles y el reintento lo completa", async () => {
    const { ana, authProvider, deleteAccount } = await setup();
    let fallos = 1;
    const original = authProvider.eliminarUsuario.bind(authProvider);
    authProvider.eliminarUsuario = async (id: string) => {
      if (fallos-- > 0) throw new Error("Supabase no responde");
      return original(id);
    };

    await expect(deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" })).rejects.toThrow();
    const reintento = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(reintento.ok).toBe(true);
    await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("el único administrador no puede eliminar su cuenta: siempre debe existir uno", async () => {
    const { deleteAccount, ana, authProvider, profileRepository } = await setup();
    authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ConflictError);
    expect(await profileRepository.findByUserId(ana.id)).toBeDefined();
    await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).resolves.toBeDefined();
  });

  it("un administrador sí puede eliminar su cuenta si existe otro administrador", async () => {
    const { deleteAccount, ana, authProvider } = await setup();
    authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");
    authProvider.asignarRolParaTest("luis@ejemplo.com", "admin");

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "12345678" });

    expect(resultado.ok).toBe(true);
    await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("la protección del último administrador se aplica antes de pedir la contraseña", async () => {
    const { deleteAccount, ana, authProvider } = await setup();
    authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");

    const resultado = await deleteAccount({ userId: ana.id, email: ana.email, password: "contraseña-mal" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ConflictError);
  });
});
