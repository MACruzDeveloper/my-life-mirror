import { describe, expect, it } from "vitest";
import { createVerifySession } from "@modules/accounts/application/VerifySession";
import { createLogIn } from "@modules/accounts/application/LogIn";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

// Usa authProvider.registrar directamente (no el caso de uso RegisterUser):
// este test es sobre verificar sesión, no sobre el flujo de registro completo.
describe("VerificarSesion", () => {
  it("devuelve el usuario cuando el token de sesión es válido", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.register("ana@ejemplo.com", "12345678");
    const session = await createLogIn(authProvider)({ email: "ana@ejemplo.com", password: "12345678" });
    const verifySession = createVerifySession(authProvider);

    const result = await verifySession(session.ok ? session.value.token : "");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("rechaza cuando no hay token", async () => {
    const verifySession = createVerifySession(new InMemoryAuthProvider());

    const result = await verifySession(undefined);

    expect(result.ok).toBe(false);
  });

  it("rechaza un token inválido", async () => {
    const verifySession = createVerifySession(new InMemoryAuthProvider());

    const result = await verifySession("token-que-no-existe");

    expect(result.ok).toBe(false);
  });
});
