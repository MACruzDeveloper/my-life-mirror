import { describe, expect, it } from "vitest";
import { createRequestPasswordReset } from "@modules/accounts/application/RequestPasswordReset";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

describe("SolicitarRecuperacion (RF-38)", () => {
  it("responde ok tanto para un email existente como para uno inexistente", async () => {
    const authProvider = new InMemoryAuthProvider();
    await authProvider.register("ana@ejemplo.com", "12345678");
    const requestPasswordReset = createRequestPasswordReset(authProvider);

    const existingResult = await requestPasswordReset({ email: "ana@ejemplo.com" });
    const nonexistentResult = await requestPasswordReset({ email: "nadie@ejemplo.com" });

    expect(existingResult.ok).toBe(true);
    expect(nonexistentResult.ok).toBe(true);
  });

  it("rechaza un email con formato inválido", async () => {
    const requestPasswordReset = createRequestPasswordReset(new InMemoryAuthProvider());

    const result = await requestPasswordReset({ email: "no-es-email" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
