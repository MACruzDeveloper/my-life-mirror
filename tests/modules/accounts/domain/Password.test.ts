import { describe, expect, it } from "vitest";
import { Password, WeakPasswordError, generatePassword } from "@modules/accounts/domain/Password";
import { checkPassword } from "@modules/accounts/domain/passwordPolicy";

describe("Password (SEC-01)", () => {
  it("acepta una contraseña que cumple la política", () => {
    const result = Password.create("Bici-Azul-Lluvia-47");

    expect(result.ok && result.value.value).toBe("Bici-Azul-Lluvia-47");
  });

  it("rechaza una débil con un error propio que dice qué requisitos fallan", () => {
    const result = Password.create("Test1234!");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(WeakPasswordError);
    expect(result.error).toMatchObject({ code: "WEAK_PASSWORD", rules: ["length", "sequence", "common"] });
  });

  it("tiene en cuenta el nombre y el email de quien la elige", () => {
    const result = Password.create("Marina-Lluvia-2026!", { email: "marina@ejemplo.com", name: "Marina" });

    expect(!result.ok && result.error.rules).toEqual(["personal"]);
  });

  it("una contraseña generada cumple siempre la política y no se repite", () => {
    const generated = Array.from({ length: 200 }, () => generatePassword());

    for (const password of generated) expect(checkPassword(password), password).toEqual([]);
    expect(new Set(generated).size).toBe(generated.length);
  });
});
