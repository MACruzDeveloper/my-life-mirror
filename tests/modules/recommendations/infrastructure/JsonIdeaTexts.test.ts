import { describe, expect, it } from "vitest";
import { JsonIdeaTexts } from "@modules/recommendations/infrastructure/JsonIdeaTexts";

describe("JsonIdeaTexts (RF-40): textos curados en el servidor", () => {
  const texts = new JsonIdeaTexts();

  it("da las cinco ideas de una categoría, en el idioma pedido", () => {
    const es = texts.candidatesFor("deporte", "es");
    const en = texts.candidatesFor("deporte", "en");

    expect(es.map((candidate) => candidate.templateKey)).toEqual(["deporte.1", "deporte.2", "deporte.3", "deporte.4", "deporte.5"]);
    expect(es[0].text).toMatch(/caminar/i);
    expect(en[0].text).toMatch(/walk/i);
  });

  it("una categoría sin ideas propias no tiene candidatas", () => {
    expect(texts.candidatesFor("no-existe", "es")).toEqual([]);
  });

  it("traduce las opciones de RF-41 y descarta las desconocidas", () => {
    expect(texts.experienceLabels(["deporte.caminar", "deporte.naturaleza", "no.existe"], "en")).toEqual(["Walking", "Outdoors"]);
  });
});
