import { describe, expect, it } from "vitest";
import { crearRegistrarUsuario } from "@modules/cuentas/application/RegistrarUsuario";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";

describe("RegistrarUsuario (RF-01)", () => {
  it("registra un usuario nuevo", async () => {
    const registrarUsuario = crearRegistrarUsuario(new InMemoryAuthProvider());

    const resultado = await registrarUsuario({ email: "ana@ejemplo.com", password: "12345678" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("rechaza el registro si el email ya existe", async () => {
    const authProvider = new InMemoryAuthProvider();
    const registrarUsuario = crearRegistrarUsuario(authProvider);
    await registrarUsuario({ email: "ana@ejemplo.com", password: "12345678" });

    const resultado = await registrarUsuario({ email: "ana@ejemplo.com", password: "otraClave123" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("CONFLICT");
    }
  });

  it("rechaza un email con formato inválido sin llegar a tocar el proveedor de auth", async () => {
    const registrarUsuario = crearRegistrarUsuario(new InMemoryAuthProvider());

    const resultado = await registrarUsuario({ email: "no-es-email", password: "12345678" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rechaza una contraseña demasiado corta", async () => {
    const registrarUsuario = crearRegistrarUsuario(new InMemoryAuthProvider());

    const resultado = await registrarUsuario({ email: "ana@ejemplo.com", password: "corta" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
