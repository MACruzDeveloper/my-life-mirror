import { describe, expect, it } from "vitest";
import { createRegisterUser } from "@modules/cuentas/application/RegisterUser";
import { createUpdateProfile } from "@modules/cuentas/application/UpdateProfile";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";
import type { ProfileRepository } from "@modules/cuentas/domain/ProfileRepository";

function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const updateProfile = createUpdateProfile(profileRepository);
  return { registerUser: createRegisterUser(authProvider, updateProfile), profileRepository };
}

describe("RegisterUser (RF-01)", () => {
  it("registra un usuario nuevo", async () => {
    const { registerUser } = setup();

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "12345678", name: "Ana" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("guarda el nombre como perfil inicial (RF-03)", async () => {
    const { registerUser, profileRepository } = setup();

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "12345678", name: "Ana" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      const profile = await profileRepository.findByUserId(resultado.value.id);
      expect(profile?.name).toBe("Ana");
    }
  });

  it("rechaza el registro si el email ya existe", async () => {
    const { registerUser } = setup();
    await registerUser({ email: "ana@ejemplo.com", password: "12345678", name: "Ana" });

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "otraClave123", name: "Ana" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("CONFLICT");
    }
  });

  it("rechaza un email con formato inválido sin llegar a tocar el proveedor de auth", async () => {
    const { registerUser } = setup();

    const resultado = await registerUser({ email: "no-es-email", password: "12345678", name: "Ana" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rechaza una contraseña demasiado corta", async () => {
    const { registerUser } = setup();

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "corta", name: "Ana" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("el registro sigue siendo válido aunque falle el guardado del perfil (best effort real)", async () => {
    const authProvider = new InMemoryAuthProvider();
    // Fake cuyo save() lanza — simula un fallo técnico del repositorio real
    // (p. ej. red/conexión del Supabase real) que hoy el adaptador en memoria no
    // puede producir por sí mismo.
    const profileRepositoryQueFalla: ProfileRepository = {
      save: () => {
        throw new Error("fallo técnico simulado del repositorio");
      },
      findByUserId: async () => undefined,
    };
    const updateProfile = createUpdateProfile(profileRepositoryQueFalla);
    const registerUser = createRegisterUser(authProvider, updateProfile);

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "12345678", name: "Ana" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("rechaza un nombre vacío", async () => {
    const { registerUser } = setup();

    const resultado = await registerUser({ email: "ana@ejemplo.com", password: "12345678", name: "   " });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
