import { describe, expect, it } from "vitest";
import { createUpdateProfile } from "@modules/cuentas/application/UpdateProfile";
import { createGetProfile } from "@modules/cuentas/application/GetProfile";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";

describe("GetProfile (RF-03)", () => {
  it("devuelve undefined si el usuario no tiene perfil configurado", async () => {
    const getProfile = createGetProfile(new InMemoryProfileRepository());

    const resultado = await getProfile("u1");

    expect(resultado).toEqual({ ok: true, value: undefined });
  });

  it("devuelve el perfil tras configurarlo", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    const getProfile = createGetProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });

    const resultado = await getProfile("u1");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value?.name).toBe("Ana");
  });

  it("rechaza un userId vacío", async () => {
    const getProfile = createGetProfile(new InMemoryProfileRepository());

    const resultado = await getProfile("");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });
});
