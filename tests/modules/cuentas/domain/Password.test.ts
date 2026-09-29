import { describe, expect, it } from "vitest";
import { Password } from "@modules/cuentas/domain/Password";

describe("Password", () => {
  it("acepta una contraseña de 8 caracteres o más", () => {
    const resultado = Password.crear("12345678");

    expect(resultado.ok).toBe(true);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    const resultado = Password.crear("1234567");

    expect(resultado.ok).toBe(false);
  });
});
