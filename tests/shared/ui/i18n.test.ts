import { describe, expect, it } from "vitest";
import i18n from "@shared/ui/i18n";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

function clavesPlanas(objeto: object, prefijo = ""): string[] {
  return Object.entries(objeto).flatMap(([clave, valor]) =>
    typeof valor === "object" && valor !== null
      ? clavesPlanas(valor as object, `${prefijo}${clave}.`)
      : [`${prefijo}${clave}`],
  );
}

describe("i18n (RNF-10)", () => {
  it("arranca en español por defecto", () => {
    expect(i18n.language).toBe("es");
  });

  it("es y en tienen exactamente el mismo conjunto de claves", () => {
    expect(clavesPlanas(es).sort()).toEqual(clavesPlanas(en).sort());
  });

  it("permite cambiar de idioma y traduce con el nuevo", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("panel.cerrarSesion")).toBe("Log out");

    await i18n.changeLanguage("es");
    expect(i18n.t("panel.cerrarSesion")).toBe("Cerrar sesión");
  });
});
