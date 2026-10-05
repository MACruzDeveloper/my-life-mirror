import { describe, expect, it } from "vitest";
import { Password } from "@modules/accounts/domain/Password";

describe("Password", () => {
  it("acepta una contraseña de 8 caracteres o más", () => {
    const result = Password.create("12345678");

    expect(result.ok).toBe(true);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    const result = Password.create("1234567");

    expect(result.ok).toBe(false);
  });
});
