import { describe, expect, it } from "vitest";
import { createResetPassword } from "@modules/accounts/application/ResetPassword";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

describe("RestablecerPassword (RF-38)", () => {
  it("cambia la contraseña con un token válido", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.register("ana@ejemplo.com", "Bici-Azul-Lluvia-47");
    await authProvider.requestPasswordReset("ana@ejemplo.com");
    const token = authProvider.resetTokenForTest("ana@ejemplo.com")!;
    const resetPassword = createResetPassword(authProvider);

    const result = await resetPassword({ token, password: "Nueva-Clave-Lluvia-47" });

    expect(result.ok).toBe(true);
    const session = await authProvider.logIn("ana@ejemplo.com", "Nueva-Clave-Lluvia-47");
    expect(session.email).toBe("ana@ejemplo.com");
  });

  it("rechaza una contraseña débil sin llegar a tocar el proveedor de auth", async () => {
    const resetPassword = createResetPassword(new InMemoryAuthProvider());

    const result = await resetPassword({ token: "cualquiera", password: "Test1234!" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ code: "WEAK_PASSWORD", rules: ["length", "sequence", "common"] });
    }
  });

  it("rechaza un token inválido", async () => {
    const resetPassword = createResetPassword(new InMemoryAuthProvider());

    const result = await resetPassword({ token: "token-inventado", password: "Nueva-Clave-Lluvia-47" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHENTICATION_ERROR");
    }
  });
});
