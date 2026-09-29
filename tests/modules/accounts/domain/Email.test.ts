import { describe, expect, it } from "vitest";
import { Email } from "@modules/accounts/domain/Email";

describe("Email", () => {
  it("acepta un email con formato válido y lo normaliza a minúsculas", () => {
    const result = Email.create("Persona@Ejemplo.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("persona@ejemplo.com");
    }
  });

  it("rechaza un email sin formato válido", () => {
    const result = Email.create("no-es-un-email");

    expect(result.ok).toBe(false);
  });
});
