import { describe, expect, it } from "vitest";
import { createActivateCategory } from "@modules/categories/application/ActivateCategory";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { crearOtorgarConsentimiento } from "@modules/consentimiento/application/OtorgarConsentimiento";
import { crearVerificarConsentimiento } from "@modules/consentimiento/application/VerificarConsentimiento";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import type { Clock } from "@shared/domain/Clock";

const POLICY_VERSION = "2026-09";
const relojFijo: Clock = { now: () => new Date("2026-09-15T10:00:00Z") };

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const consentRepository = new InMemoryConsentimientoRepository();
  const verifyConsent = crearVerificarConsentimiento(consentRepository);
  const grantConsent = crearOtorgarConsentimiento(consentRepository, relojFijo);
  const catalog = new InMemoryCategoryCatalogRepository();
  const listCategories = createListCategories(categoryRepository, catalog);
  const activateCategory = createActivateCategory(categoryRepository, verifyConsent, catalog);

  const listado = await listCategories("u1");
  if (!listado.ok) throw new Error("setup falló");
  const categorias = listado.value;
  const noSensible = categorias.find((c) => !c.isSensitiveData)!;
  const sensible = categorias.find((c) => c.isSensitiveData)!;

  return { activateCategory, grantConsent, noSensible, sensible, catalog };
}

describe("ActivateCategory (RF-07/RF-04)", () => {
  it("activa directamente una categoría no sensible", async () => {
    const { activateCategory, noSensible } = await setup();

    const resultado = await activateCategory({ userId: "u1", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.status).toBe("active");
  });

  it("rechaza activar una categoría sensible sin consentimiento (CONSENT_REQUIRED)", async () => {
    const { activateCategory, sensible } = await setup();

    const resultado = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("CONSENT_REQUIRED");
  });

  it("activa una categoría sensible tras otorgar el consentimiento", async () => {
    const { activateCategory, grantConsent, sensible } = await setup();
    await grantConsent({ usuarioId: "u1", categoriaId: sensible.id, versionPolitica: POLICY_VERSION });

    const resultado = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.status).toBe("active");
  });

  it("un consentimiento de otra versión de política no vale (hay que volver a pedirlo)", async () => {
    const { activateCategory, grantConsent, sensible } = await setup();
    await grantConsent({ usuarioId: "u1", categoriaId: sensible.id, versionPolitica: "2025-01" });

    const resultado = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("CONSENT_REQUIRED");
  });

  it("rechaza una categoría que no existe", async () => {
    const { activateCategory } = await setup();

    const resultado = await activateCategory({ userId: "u1", categoryId: "no-existe", policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("NOT_FOUND");
  });

  it("rechaza entradas vacías", async () => {
    const { activateCategory, noSensible } = await setup();

    const resultado = await activateCategory({ userId: "", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza activar una categoría que el admin ya retiró del catálogo", async () => {
    const { activateCategory, noSensible, catalog } = await setup();
    const entrada = (await catalog.findAll()).find((c) => c.name === noSensible.name)!;
    await catalog.save({ ...entrada, retiredAt: new Date("2026-09-19T10:00:00Z") });

    const resultado = await activateCategory({ userId: "u1", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("NOT_FOUND");
  });
});
