import { describe, expect, it } from "vitest";
import { getCrisisHelplines } from "@modules/wellbeing/application/getCrisisHelplines";

describe("obtenerLineasAyudaCrisis (RF-30)", () => {
  it("para España devuelve la línea 024 y el 112", () => {
    const lineas = getCrisisHelplines("ES");

    expect(lineas.some((l) => l.phone === "024")).toBe(true);
    expect(lineas.some((l) => l.phone === "112")).toBe(true);
  });

  it("para un país sin datos específicos devuelve un recurso internacional por defecto", () => {
    const lineas = getCrisisHelplines("XX");

    expect(lineas).toHaveLength(1);
    expect(lineas[0].pais).toBe("INTL");
  });

  it("no depende de la capitalización del código de país", () => {
    const lineas = getCrisisHelplines("es");

    expect(lineas.some((l) => l.phone === "024")).toBe(true);
  });
});
