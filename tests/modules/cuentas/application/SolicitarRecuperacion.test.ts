import { describe, expect, it } from "vitest";
import { crearSolicitarRecuperacion } from "@modules/cuentas/application/SolicitarRecuperacion";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";

describe("SolicitarRecuperacion (RF-38)", () => {
  it("responde ok tanto para un email existente como para uno inexistente", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.registrar("ana@ejemplo.com", "12345678");
    const solicitarRecuperacion = crearSolicitarRecuperacion(authProvider);

    const resultadoExistente = await solicitarRecuperacion({ email: "ana@ejemplo.com" });
    const resultadoInexistente = await solicitarRecuperacion({ email: "nadie@ejemplo.com" });

    expect(resultadoExistente.ok).toBe(true);
    expect(resultadoInexistente.ok).toBe(true);
  });

  it("rechaza un email con formato inválido", async () => {
    const solicitarRecuperacion = crearSolicitarRecuperacion(new InMemoryAuthProvider());

    const resultado = await solicitarRecuperacion({ email: "no-es-email" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
