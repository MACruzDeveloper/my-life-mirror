import { describe, expect, it } from "vitest";
import { createRegisterUser } from "@modules/accounts/application/RegisterUser";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import type { ProfileRepository } from "@modules/accounts/domain/ProfileRepository";

function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const updateProfile = createUpdateProfile(profileRepository);
  return { registerUser: createRegisterUser(authProvider, updateProfile), profileRepository };
}

describe("RegisterUser (RF-01)", () => {
  it("registra un usuario nuevo", async () => {
    const { registerUser } = setup();

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "Ana" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("guarda el nombre como perfil inicial (RF-03)", async () => {
    const { registerUser, profileRepository } = setup();

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "Ana" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const profile = await profileRepository.findByUserId(result.value.id);
      expect(profile?.name).toBe("Ana");
    }
  });

  it("rechaza el registro si el email ya existe", async () => {
    const { registerUser } = setup();
    await registerUser({ email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "Ana" });

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Otra-Clave-Lluvia-47", name: "Ana" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFLICT");
    }
  });

  it("rechaza un email con formato inválido sin llegar a tocar el proveedor de auth", async () => {
    const { registerUser } = setup();

    const result = await registerUser({ email: "no-es-email", password: "Bici-Azul-Lluvia-47", name: "Ana" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rechaza una contraseña débil y dice qué requisitos fallan (SEC-01)", async () => {
    const { registerUser } = setup();

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Test1234!", name: "Ana" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ code: "WEAK_PASSWORD", rules: ["length", "sequence", "common"] });
  });

  it("rechaza una contraseña que contiene el nombre o el email de quien se registra (SEC-01)", async () => {
    const { registerUser } = setup();

    const byName = await registerUser({ email: "ana@ejemplo.com", password: "Marina-Lluvia-2026!", name: "Marina López" });
    const byEmail = await registerUser({ email: "marina.lopez@ejemplo.com", password: "Azul-Lopez-Lluvia-47", name: "M" });

    for (const result of [byName, byEmail]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatchObject({ code: "WEAK_PASSWORD", rules: ["personal"] });
    }
  });

  it("el registro sigue siendo válido aunque falle el guardado del perfil (best effort real)", async () => {
    const authProvider = new InMemoryAuthProvider();
    // Fake cuyo save() lanza — simula un fallo técnico del repositorio real
    // (p. ej. red/conexión del Supabase real) que hoy el adaptador en memoria no
    // puede producir por sí mismo.
    const failingProfileRepository: ProfileRepository = {
      save: () => {
        throw new Error("fallo técnico simulado del repositorio");
      },
      findByUserId: async () => undefined,
      deleteByUserId: async () => undefined,
    };
    const updateProfile = createUpdateProfile(failingProfileRepository);
    const registerUser = createRegisterUser(authProvider, updateProfile);

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "Ana" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("rechaza un nombre vacío", async () => {
    const { registerUser } = setup();

    const result = await registerUser({ email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47", name: "   " });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
