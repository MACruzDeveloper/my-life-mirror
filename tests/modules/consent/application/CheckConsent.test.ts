import { describe, expect, it } from "vitest";
import { createGrantConsent } from "@modules/consent/application/GrantConsent";
import { createCheckConsent } from "@modules/consent/application/CheckConsent";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";
import type { Clock } from "@shared/domain/Clock";

const fixedClock: Clock = { now: () => new Date("2026-09-14T10:00:00Z") };

describe("VerificarConsentimiento (RF-04)", () => {
  it("devuelve false si el usuario nunca otorgó consentimiento para esa categoría", async () => {
    const checkConsent = createCheckConsent(new InMemoryConsentRepository());

    const result = await checkConsent({
      userId: "u1",
      categoryId: "salud",
      policyVersion: "2026-01",
    });

    expect(result).toEqual({ ok: true, value: false });
  });

  it("devuelve true tras otorgar el consentimiento para esa misma versión de política", async () => {
    const repo = new InMemoryConsentRepository();
    const grantConsent = createGrantConsent(repo, fixedClock);
    const checkConsent = createCheckConsent(repo);
    await grantConsent({ userId: "u1", categoryId: "salud", policyVersion: "2026-01" });

    const result = await checkConsent({
      userId: "u1",
      categoryId: "salud",
      policyVersion: "2026-01",
    });

    expect(result).toEqual({ ok: true, value: true });
  });

  it("devuelve false si la política cambió de versión desde que se otorgó", async () => {
    const repo = new InMemoryConsentRepository();
    const grantConsent = createGrantConsent(repo, fixedClock);
    const checkConsent = createCheckConsent(repo);
    await grantConsent({ userId: "u1", categoryId: "salud", policyVersion: "2026-01" });

    const result = await checkConsent({
      userId: "u1",
      categoryId: "salud",
      policyVersion: "2026-02",
    });

    expect(result).toEqual({ ok: true, value: false });
  });

  it("rechaza entradas vacías con un error de validación", async () => {
    const checkConsent = createCheckConsent(new InMemoryConsentRepository());

    const result = await checkConsent({ userId: "", categoryId: "salud", policyVersion: "2026-01" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
