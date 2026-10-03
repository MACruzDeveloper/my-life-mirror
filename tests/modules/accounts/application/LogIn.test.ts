import { describe, expect, it } from "vitest";
import { createLogIn } from "@modules/accounts/application/LogIn";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

// Usa authProvider.registrar directamente (no el caso de uso RegisterUser):
// estos tests son sobre login/sesión, no sobre el flujo de registro completo.
describe("IniciarSesion (RF-01)", () => {
  it("inicia sesión con credenciales correctas y devuelve un token", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.register("ana@ejemplo.com", "12345678");
    const logIn = createLogIn(authProvider);

    const result = await logIn({ email: "ana@ejemplo.com", password: "12345678" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("ana@ejemplo.com");
      expect(typeof result.value.token).toBe("string");
    }
  });

  it("rechaza credenciales incorrectas", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.register("ana@ejemplo.com", "12345678");
    const logIn = createLogIn(authProvider);

    const result = await logIn({ email: "ana@ejemplo.com", password: "incorrecta" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHENTICATION_ERROR");
    }
  });

  it("rechaza un email con formato inválido sin llegar a tocar el proveedor de auth", async () => {
    const logIn = createLogIn(new InMemoryAuthProvider());

    const result = await logIn({ email: "no-es-email", password: "12345678" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
