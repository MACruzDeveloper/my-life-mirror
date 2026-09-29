import { describe, expect, it } from "vitest";
import i18n from "@shared/ui/i18n";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

function flatKeys(object: object, prefix = ""): string[] {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatKeys(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("i18n (RNF-10)", () => {
  it("arranca en español por defecto", () => {
    expect(i18n.language).toBe("es");
  });

  it("es y en tienen exactamente el mismo conjunto de claves", () => {
    expect(flatKeys(es).sort()).toEqual(flatKeys(en).sort());
  });

  it("permite cambiar de idioma y traduce con el nuevo", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("panel.cerrarSesion")).toBe("Log out");

    await i18n.changeLanguage("es");
    expect(i18n.t("panel.cerrarSesion")).toBe("Cerrar sesión");
  });
});
