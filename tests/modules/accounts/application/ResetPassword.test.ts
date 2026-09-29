import { describe, expect, it } from "vitest";
import { createResetPassword } from "@modules/accounts/application/ResetPassword";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

describe("RestablecerPassword (RF-38)", () => {
  it("cambia la contraseña con un token válido", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    await authProvider.requestPasswordReset("ana@ejemplo.com");
    const token = authProvider.resetTokenForTest("ana@ejemplo.com")!;
    const resetPassword = createResetPassword(authProvider);

    const result = await resetPassword({ token, password: "nuevaClave123" });

    expect(result.ok).toBe(true);
    const session = await authProvider.logIn("ana@ejemplo.com", "nuevaClave123");
    expect(session.email).toBe("ana@ejemplo.com");
  });

  it("rechaza una contraseña demasiado corta sin llegar a tocar el proveedor de auth", async () => {
    const resetPassword = createResetPassword(new InMemoryAuthProvider());

    const result = await resetPassword({ token: "cualquiera", password: "corta" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rechaza un token inválido", async () => {
    const resetPassword = createResetPassword(new InMemoryAuthProvider());

    const result = await resetPassword({ token: "token-inventado", password: "nuevaClave123" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHENTICATION_ERROR");
    }
  });
});
