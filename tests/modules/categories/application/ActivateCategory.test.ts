import { describe, expect, it } from "vitest";
import { createActivateCategory } from "@modules/categories/application/ActivateCategory";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { createGrantConsent } from "@modules/consent/application/GrantConsent";
import { createCheckConsent } from "@modules/consent/application/CheckConsent";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";
import type { Clock } from "@shared/domain/Clock";

const POLICY_VERSION = "2026-09";
const fixedClock: Clock = { now: () => new Date("2026-09-15T10:00:00Z") };

async function setup() {
  const categoryRepository = new InMemoryCategoryRepository();
  const consentRepository = new InMemoryConsentRepository();
  const verifyConsent = createCheckConsent(consentRepository);
  const grantConsent = createGrantConsent(consentRepository, fixedClock);
  const catalog = new InMemoryCategoryCatalogRepository();
  const listCategories = createListCategories(categoryRepository, catalog);
  const activateCategory = createActivateCategory(categoryRepository, verifyConsent, catalog);

  const listed = await listCategories("u1");
  if (!listed.ok) throw new Error("setup falló");
  const categories = listed.value;
  const nonSensitive = categories.find((c) => !c.isSensitiveData)!;
  const sensitive = categories.find((c) => c.isSensitiveData)!;

  return { activateCategory, grantConsent, noSensible: nonSensitive, sensible: sensitive, catalog };
}

describe("ActivateCategory (RF-07/RF-04)", () => {
  it("activa directamente una categoría no sensible", async () => {
    const { activateCategory, noSensible } = await setup();

    const result = await activateCategory({ userId: "u1", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("active");
  });

  it("rechaza activar una categoría sensible sin consentimiento (CONSENT_REQUIRED)", async () => {
    const { activateCategory, sensible } = await setup();

    const result = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CONSENT_REQUIRED");
  });

  it("activa una categoría sensible tras otorgar el consentimiento", async () => {
    const { activateCategory, grantConsent, sensible } = await setup();
    await grantConsent({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    const result = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe("active");
  });

  it("un consentimiento de otra versión de política no vale (hay que volver a pedirlo)", async () => {
    const { activateCategory, grantConsent, sensible } = await setup();
    await grantConsent({ userId: "u1", categoryId: sensible.id, policyVersion: "2025-01" });

    const result = await activateCategory({ userId: "u1", categoryId: sensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CONSENT_REQUIRED");
  });

  it("rechaza una categoría que no existe", async () => {
    const { activateCategory } = await setup();

    const result = await activateCategory({ userId: "u1", categoryId: "no-existe", policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("rechaza entradas vacías", async () => {
    const { activateCategory, noSensible } = await setup();

    const result = await activateCategory({ userId: "", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza activar una categoría que el admin ya retiró del catálogo", async () => {
    const { activateCategory, noSensible, catalog } = await setup();
    const entry = (await catalog.findAll()).find((c) => c.id === noSensible.catalogId)!;
    await catalog.save({ ...entry, retiredAt: new Date("2026-09-19T10:00:00Z") });

    const result = await activateCategory({ userId: "u1", categoryId: noSensible.id, policyVersion: POLICY_VERSION });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });
});
