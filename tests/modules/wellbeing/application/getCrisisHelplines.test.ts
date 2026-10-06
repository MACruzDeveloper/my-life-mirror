import { describe, expect, it } from "vitest";
import { getCrisisHelplines } from "@modules/wellbeing/application/getCrisisHelplines";
import helplines from "@modules/wellbeing/domain/catalog/helplines.json";
import es from "@shared/ui/i18n/locales/es.json";
import en from "@shared/ui/i18n/locales/en.json";

describe("getCrisisHelplines (RF-30)", () => {
  it("para España devuelve la línea 024 y el 112", () => {
    const lines = getCrisisHelplines("ES");

    expect(lines.map((line) => line.phone)).toEqual(["024", "112"]);
    expect(lines.every((line) => line.country === "ES")).toBe(true);
  });

  it("para un país sin datos específicos devuelve el directorio internacional", () => {
    const lines = getCrisisHelplines("XX");

    expect(lines).toEqual([{ key: "findAHelpline", country: "INTL", url: "https://findahelpline.com" }]);
  });

  it("no depende de la capitalización del código de país", () => {
    expect(getCrisisHelplines("es").some((line) => line.phone === "024")).toBe(true);
  });
});

describe("catálogo de líneas de ayuda (RF-30, CAT-01)", () => {
  it("claves únicas, y cada línea con teléfono o enlace", () => {
    expect(new Set(helplines.map((line) => line.key)).size).toBe(helplines.length);
    for (const line of helplines) expect(Boolean(("phone" in line && line.phone) || ("url" in line && line.url)), line.key).toBe(true);
  });

  it("cada línea tiene nombre y disponibilidad en español e inglés", () => {
    for (const texts of [es.ayuda.lineas, en.ayuda.lineas] as Record<string, { nombre?: string; disponibilidad?: string }>[]) {
      for (const line of helplines) {
        expect(texts[line.key]?.nombre, line.key).toBeTruthy();
        expect(texts[line.key]?.disponibilidad, line.key).toBeTruthy();
      }
    }
  });
});
