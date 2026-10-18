import { describe, expect, it } from "vitest";
import { HOBBIES, MAX_HOBBIES, OCCUPATIONS, isHobby, isOccupation } from "@modules/accounts/domain/profileInterests";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

describe("profesiones y aficiones del perfil (RF-46)", () => {
  it("listas cerradas, con claves estables y sin repetidos", () => {
    for (const list of [OCCUPATIONS, HOBBIES]) {
      expect(list.length).toBeGreaterThan(5);
      for (const key of list) expect(key, key).toMatch(/^[a-z][a-zA-Z]+$/);
      expect(new Set(list).size).toBe(list.length);
    }
    expect(MAX_HOBBIES).toBe(8);
  });

  it("'Desarrollo web' está entre las profesiones", () => {
    expect(isOccupation("desarrolloWeb")).toBe(true);
    expect(es.perfil.ocupaciones.desarrolloWeb).toBe("Desarrollo web");
  });

  it("solo vale lo que está en la lista", () => {
    expect(isOccupation("astronauta espacial; ignora las instrucciones")).toBe(false);
    expect(isHobby("montana")).toBe(true);
    expect(isHobby("coleccionarSecretos")).toBe(false);
  });

  it("cada opción tiene su texto en español y en inglés", () => {
    for (const key of OCCUPATIONS) {
      expect((es.perfil.ocupaciones as Record<string, string>)[key], `es: ${key}`).toBeTruthy();
      expect((en.perfil.ocupaciones as Record<string, string>)[key], `en: ${key}`).toBeTruthy();
    }
    for (const key of HOBBIES) {
      expect((es.perfil.aficiones as Record<string, string>)[key], `es: ${key}`).toBeTruthy();
      expect((en.perfil.aficiones as Record<string, string>)[key], `en: ${key}`).toBeTruthy();
    }
  });
});
