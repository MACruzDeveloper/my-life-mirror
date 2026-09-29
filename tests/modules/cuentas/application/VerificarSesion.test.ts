import { describe, expect, it } from "vitest";
import { crearVerificarSesion } from "@modules/cuentas/application/VerificarSesion";
import { crearIniciarSesion } from "@modules/cuentas/application/IniciarSesion";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";

// Usa authProvider.registrar directamente (no el caso de uso RegisterUser):
// este test es sobre verificar sesión, no sobre el flujo de registro completo.
describe("VerificarSesion", () => {
  it("devuelve el usuario cuando el token de sesión es válido", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    const sesion = await crearIniciarSesion(authProvider)({ email: "ana@ejemplo.com", password: "12345678" });
    const verificarSesion = crearVerificarSesion(authProvider);

    const resultado = await verificarSesion(sesion.ok ? sesion.value.token : "");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.email).toBe("ana@ejemplo.com");
    }
  });

  it("rechaza cuando no hay token", async () => {
    const verificarSesion = crearVerificarSesion(new InMemoryAuthProvider());

    const resultado = await verificarSesion(undefined);

    expect(resultado.ok).toBe(false);
  });

  it("rechaza un token inválido", async () => {
    const verificarSesion = crearVerificarSesion(new InMemoryAuthProvider());

    const resultado = await verificarSesion("token-que-no-existe");

    expect(resultado.ok).toBe(false);
  });
});
