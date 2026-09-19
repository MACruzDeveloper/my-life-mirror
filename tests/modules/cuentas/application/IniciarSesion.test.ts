import { describe, expect, it } from "vitest";
import { crearIniciarSesion } from "@modules/cuentas/application/IniciarSesion";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";

// Usa authProvider.registrar directamente (no el caso de uso RegisterUser):
// estos tests son sobre login/sesión, no sobre el flujo de registro completo.
describe("IniciarSesion (RF-01)", () => {
  it("inicia sesión con credenciales correctas y devuelve un token", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    const iniciarSesion = crearIniciarSesion(authProvider);

    const resultado = await iniciarSesion({ email: "ana@ejemplo.com", password: "12345678" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.email).toBe("ana@ejemplo.com");
      expect(typeof resultado.value.token).toBe("string");
    }
  });

  it("rechaza credenciales incorrectas", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    const iniciarSesion = crearIniciarSesion(authProvider);

    const resultado = await iniciarSesion({ email: "ana@ejemplo.com", password: "incorrecta" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("AUTHENTICATION_ERROR");
    }
  });

  it("rechaza un email con formato inválido sin llegar a tocar el proveedor de auth", async () => {
    const iniciarSesion = crearIniciarSesion(new InMemoryAuthProvider());

    const resultado = await iniciarSesion({ email: "no-es-email", password: "12345678" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
