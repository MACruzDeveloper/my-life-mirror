import { describe, expect, it } from "vitest";
import { crearRestablecerPassword } from "@modules/cuentas/application/RestablecerPassword";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";

describe("RestablecerPassword (RF-38)", () => {
  it("cambia la contraseña con un token válido", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    await authProvider.solicitarRecuperacion("ana@ejemplo.com");
    const token = authProvider.tokenDeRecuperacionParaTest("ana@ejemplo.com")!;
    const restablecerPassword = crearRestablecerPassword(authProvider);

    const resultado = await restablecerPassword({ token, password: "nuevaClave123" });

    expect(resultado.ok).toBe(true);
    const sesion = await authProvider.iniciarSesion("ana@ejemplo.com", "nuevaClave123");
    expect(sesion.email).toBe("ana@ejemplo.com");
  });

  it("rechaza una contraseña demasiado corta sin llegar a tocar el proveedor de auth", async () => {
    const restablecerPassword = crearRestablecerPassword(new InMemoryAuthProvider());

    const resultado = await restablecerPassword({ token: "cualquiera", password: "corta" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rechaza un token inválido", async () => {
    const restablecerPassword = crearRestablecerPassword(new InMemoryAuthProvider());

    const resultado = await restablecerPassword({ token: "token-inventado", password: "nuevaClave123" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("AUTHENTICATION_ERROR");
    }
  });
});
