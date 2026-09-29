import { describe, expect, it } from "vitest";
import { createUpdateProfile } from "@modules/cuentas/application/UpdateProfile";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";

const VALID_TIME_ZONE = "Europe/Madrid";
const VALID_BIRTH_DATE = "1996-05-20";

describe("UpdateProfile (RF-03/RF-01)", () => {
  it("crea un perfil nuevo solo con el nombre (caso del registro, RF-01)", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "u1", name: "Ana" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toEqual({ userId: "u1", name: "Ana" });
    }
  });

  it("rellena birthDate/gender/timeZone más tarde sin pisar el nombre ya guardado", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });

    const resultado = await updateProfile({
      userId: "u1",
      birthDate: VALID_BIRTH_DATE,
      gender: "woman",
      timeZone: VALID_TIME_ZONE,
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value).toEqual({
        userId: "u1",
        name: "Ana",
        birthDate: VALID_BIRTH_DATE,
        gender: "woman",
        timeZone: VALID_TIME_ZONE,
      });
    }
  });

  it("actualizar un campo no borra los demás ya guardados", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana", birthDate: VALID_BIRTH_DATE, timeZone: VALID_TIME_ZONE });

    const resultado = await updateProfile({ userId: "u1", name: "Ana María" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.birthDate).toBe(VALID_BIRTH_DATE);
      expect(resultado.value.timeZone).toBe(VALID_TIME_ZONE);
      expect(resultado.value.name).toBe("Ana María");
    }
  });

  it("rechaza si no hay perfil todavía y no se indica nombre", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "u1", timeZone: VALID_TIME_ZONE });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una llamada sin ningún campo", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "u1" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza un nombre vacío", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "u1", name: "  " });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it.each(["fecha-invalida", "2099-01-01", "1850-01-01"])(
    "rechaza una fecha de nacimiento no válida (%s)",
    async (birthDate) => {
      const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

      const resultado = await updateProfile({ userId: "u1", name: "Ana", birthDate });

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
    },
  );

  it("rechaza una zona horaria que no es un identificador IANA válido", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "u1", name: "Ana", timeZone: "Marte/Colonia1" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza un género que no está en la lista conocida", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({
      userId: "u1",
      name: "Ana",
      // @ts-expect-error — valor inválido a propósito para probar la validación
      gender: "not-listed",
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza sin userId", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const resultado = await updateProfile({ userId: "", name: "Ana" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe("VALIDATION_ERROR");
  });

  it("deleteByUserId del repositorio borra el perfil de ese usuario (RF-05)", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });
    await updateProfile({ userId: "u2", name: "Luis" });

    await repo.deleteByUserId("u1");

    expect(await repo.findByUserId("u1")).toBeUndefined();
    expect(await repo.findByUserId("u2")).toBeDefined();
  });
});
