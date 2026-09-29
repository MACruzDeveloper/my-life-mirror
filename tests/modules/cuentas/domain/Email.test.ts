import { describe, expect, it } from "vitest";
import { Email } from "@modules/cuentas/domain/Email";

describe("Email", () => {
  it("acepta un email con formato válido y lo normaliza a minúsculas", () => {
    const resultado = Email.crear("Persona@Ejemplo.com");

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.valor).toBe("persona@ejemplo.com");
    }
  });

  it("rechaza un email sin formato válido", () => {
    const resultado = Email.crear("no-es-un-email");

    expect(resultado.ok).toBe(false);
  });
});
