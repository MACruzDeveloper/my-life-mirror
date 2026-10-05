import { describe, expect, it } from "vitest";
import { FakeOptionSuggester } from "@modules/recommendations/infrastructure/FakeOptionSuggester";

const ADVENTURE = {
  locale: "es" as const,
  categoryKey: "aventura",
  helps: [
    { key: "aventura.viajar", label: "Viajar" },
    { key: "aventura.comidaNueva", label: "Probar comidas nuevas" },
    { key: "aventura.naturaleza", label: "Naturaleza" },
  ],
  difficulties: [{ key: "salirDeCasa", label: "Salir de casa" }],
};

describe("FakeOptionSuggester (RF-45): palabras clave, sin IA", () => {
  it("reconoce otras formas de la misma palabra ('viajé' → 'Viajar')", async () => {
    const result = await new FakeOptionSuggester().suggest({ ...ADVENTURE, text: "Antes del Covid viajé bastante por Asia de mochilero" });

    expect(result).toEqual({ helps: ["aventura.viajar"], difficulties: [] });
  });

  it("y plurales ('Probar comidas nuevas' con 'probar una comida nueva')", async () => {
    const result = await new FakeOptionSuggester().suggest({ ...ADVENTURE, text: "Me encanta probar una comida nueva, aunque me cuesta salir de casa" });

    expect(result).toEqual({ helps: ["aventura.comidaNueva"], difficulties: ["salirDeCasa"] });
  });

  it("exige todas las palabras significativas: 'gente' sola no propone 'Conocer gente nueva'", async () => {
    const result = await new FakeOptionSuggester().suggest({
      locale: "es",
      categoryKey: "vidaSocial",
      text: "Me agobian los sitios con mucha gente",
      helps: [{ key: "vidaSocial.conocerGente", label: "Conocer gente nueva" }],
      difficulties: [{ key: "sitiosConGente", label: "Sitios con mucha gente" }],
    });

    expect(result).toEqual({ helps: [], difficulties: ["sitiosConGente"] });
  });
});
