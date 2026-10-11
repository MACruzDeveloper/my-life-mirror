import { describe, expect, it } from "vitest";
import { PASSWORD_RULES, checkPassword } from "@modules/accounts/domain/passwordPolicy";
import commonPasswords from "@modules/accounts/domain/catalog/commonPasswords.json";

describe("política de contraseñas (SEC-01)", () => {
  it.each(["Bici-Azul-Lluvia-47", "tres Gatos y 2 perros!", "x7#Kp9$mQ2&vLw", "Montaña_Ñandú_2026"])("acepta una contraseña larga, variada y nada previsible: %s", (password) => {
    expect(checkPassword(password)).toEqual([]);
  });

  it.each([
    ["Corta-7a", "length"],
    ["Bici-Azul-Lluvia-47".repeat(4), "length"],
    ["BICI-AZUL-LLUVIA-47", "lowercase"],
    ["bici-azul-lluvia-47", "uppercase"],
    ["Bici-Azul-Lluvia-xx", "digit"],
    ["BiciAzulConLluvia47", "symbol"],
  ])("exige longitud y los cuatro tipos de caracteres: %s → %s", (password, rule) => {
    expect(checkPassword(password)).toEqual([rule]);
  });

  it.each(["Bici-Azul-1234-Lluvia", "Bici-Azul-9876-Lluvia", "Bici-Azul-Abcd-97", "Bici-Qwer-Lluvia-47", "Bici-Azul-Lluuuvia-47"])(
    "rechaza secuencias y repeticiones: %s",
    (password) => {
      expect(checkPassword(password)).toEqual(["sequence"]);
    },
  );

  it.each(["Password-2026!", "P4ssw0rd!2026#", "Contraseña.2026", "MyLifeMirror#26", "Welcome!2026.."])("rechaza una palabra común aunque lleve números, símbolos o sustituciones: %s", (password) => {
    expect(checkPassword(password)).toEqual(["common"]);
  });

  it("los ejemplos típicos fallan, cada uno por lo suyo", () => {
    expect(checkPassword("Test1234!")).toEqual(["length", "sequence", "common"]);
    expect(checkPassword("Password1234!")).toEqual(["sequence", "common"]);
    expect(checkPassword("Qwerty-12345")).toEqual(["sequence", "common"]);
  });

  it("rechaza la que contiene el nombre o el principio del email, sin importar mayúsculas ni tildes", () => {
    const context = { email: "marina.lopez@ejemplo.com", name: "Marina López" };

    expect(checkPassword("Marina-Lluvia-2026!", context)).toEqual(["personal"]);
    expect(checkPassword("Azul-LOPEZ-Lluvia-47", context)).toEqual(["personal"]);
    expect(checkPassword("Bici-Azul-Lluvia-47", context)).toEqual([]);
  });

  it("los trozos de menos de 4 letras no cuentan como dato personal (Ana no prohíbe 'banana')", () => {
    expect(checkPassword("Banana-Azul-Lluvia-47", { email: "ana@ejemplo.com", name: "Ana" })).toEqual([]);
  });

  it("las reglas se devuelven en el orden de la lista, que es el de la interfaz", () => {
    const rules = checkPassword("aaaa");
    expect(rules).toEqual([...PASSWORD_RULES].filter((rule) => rules.includes(rule)));
  });

  it("integridad de la lista de contraseñas comunes: en minúsculas, solo letras sin tildes y sin repetidos", () => {
    expect(commonPasswords.length).toBeGreaterThan(100);
    for (const word of commonPasswords) expect(word, word).toMatch(/^[a-z]{3,}$/);
    expect(new Set(commonPasswords).size).toBe(commonPasswords.length);
  });
});
