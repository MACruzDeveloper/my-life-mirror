import { describe, expect, it } from "vitest";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { createGetProfile } from "@modules/accounts/application/GetProfile";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";

describe("GetProfile (RF-03)", () => {
  it("devuelve undefined si el usuario no tiene perfil configurado", async () => {
    const getProfile = createGetProfile(new InMemoryProfileRepository());

    const result = await getProfile("u1");

    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("devuelve el perfil tras configurarlo", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    const getProfile = createGetProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });

    const result = await getProfile("u1");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value?.name).toBe("Ana");
  });

  it("rechaza un userId vacío", async () => {
    const getProfile = createGetProfile(new InMemoryProfileRepository());

    const result = await getProfile("");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });
});
