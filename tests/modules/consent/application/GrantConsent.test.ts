import { describe, expect, it } from "vitest";
import type { Clock } from "@shared/domain/Clock";
import { createGrantConsent } from "@modules/consent/application/GrantConsent";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";

const FIXED_DATE = new Date("2026-09-14T10:00:00Z");
const fixedClock: Clock = { now: () => FIXED_DATE };

describe("OtorgarConsentimiento (RF-04)", () => {
  it("crea un consentimiento nuevo con la fecha del reloj inyectado", async () => {
    const grantConsent = createGrantConsent(new InMemoryConsentRepository(), fixedClock);

    const result = await grantConsent({
      userId: "u1",
      categoryId: "salud",
      policyVersion: "2026-01",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userId).toBe("u1");
      expect(result.value.categoryId).toBe("salud");
      expect(result.value.policyVersion).toBe("2026-01");
      expect(result.value.grantedAt).toEqual(FIXED_DATE);
    }
  });

  it("es idempotente: otorgarlo dos veces bajo la misma política no crea un duplicado", async () => {
    const repo = new InMemoryConsentRepository();
    const grantConsent = createGrantConsent(repo, fixedClock);
    const input = { userId: "u1", categoryId: "salud", policyVersion: "2026-01" };

    const first = await grantConsent(input);
    const second = await grantConsent(input);

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.value.id).toBe(first.value.id);
    }
  });

  it("un cambio de versión de política exige (y crea) un consentimiento nuevo", async () => {
    const repo = new InMemoryConsentRepository();
    const grantConsent = createGrantConsent(repo, fixedClock);
    const first = await grantConsent({ userId: "u1", categoryId: "salud", policyVersion: "2026-01" });

    const second = await grantConsent({ userId: "u1", categoryId: "salud", policyVersion: "2026-02" });

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.value.id).not.toBe(first.value.id);
    }
  });

  it.each([
    { userId: "", categoryId: "salud", policyVersion: "2026-01" },
    { userId: "u1", categoryId: "", policyVersion: "2026-01" },
    { userId: "u1", categoryId: "salud", policyVersion: "" },
  ])("rechaza entradas vacías sin llegar al repositorio (%o)", async (input) => {
    const grantConsent = createGrantConsent(new InMemoryConsentRepository(), fixedClock);

    const result = await grantConsent(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
