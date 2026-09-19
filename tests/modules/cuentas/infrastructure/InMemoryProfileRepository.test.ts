import { describe, expect, it } from "vitest";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";
import type { Profile } from "@modules/cuentas/domain/Profile";

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "u1",
    name: "Ana",
    birthDate: "1996-05-20",
    timeZone: "Europe/Madrid",
    ...overrides,
  };
}

describe("InMemoryProfileRepository", () => {
  it("no encuentra nada antes de guardar", async () => {
    const repo = new InMemoryProfileRepository();

    const found = await repo.findByUserId("u1");

    expect(found).toBeUndefined();
  });

  it("encuentra el perfil guardado por usuario", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(createProfile());

    const found = await repo.findByUserId("u1");

    expect(found?.name).toBe("Ana");
  });

  it("guardar de nuevo sobrescribe el perfil anterior del mismo usuario (upsert)", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(createProfile({ name: "Ana" }));

    await repo.save(createProfile({ name: "Ana María" }));
    const found = await repo.findByUserId("u1");

    expect(found?.name).toBe("Ana María");
  });
});
