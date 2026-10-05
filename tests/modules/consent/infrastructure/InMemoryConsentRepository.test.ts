import { describe, expect, it } from "vitest";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";
import type { Consent } from "@modules/consent/domain/Consent";

function consent(overrides: Partial<Consent> = {}): Consent {
  return { id: "1", userId: "u1", categoryId: "c1", policyVersion: "2026-09", grantedAt: new Date("2026-09-19T10:00:00Z"), ...overrides };
}

describe("InMemoryConsentimientoRepository (RF-05)", () => {
  it("buscarPorUsuario devuelve solo los del usuario", async () => {
    const repo = new InMemoryConsentRepository();
    await repo.save(consent({ id: "1" }));
    await repo.save(consent({ id: "2", userId: "u2" }));

    expect((await repo.findByUser("u1")).map((c) => c.id)).toEqual(["1"]);
  });

  it("eliminarPorUsuario borra los de ese usuario y no los de los demás", async () => {
    const repo = new InMemoryConsentRepository();
    await repo.save(consent({ id: "1" }));
    await repo.save(consent({ id: "2", userId: "u2" }));

    await repo.deleteByUser("u1");

    expect(await repo.findByUser("u1")).toEqual([]);
    expect(await repo.findByUser("u2")).toHaveLength(1);
  });
});
