import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { AnthropicIdeaReviewer, AnthropicIdeaWriter, AnthropicOptionSuggester } from "@modules/recommendations/infrastructure/anthropic/AnthropicIdeaProvider";
import type { StructuredModel } from "@modules/recommendations/infrastructure/anthropic/StructuredModel";
import type { IdeaRequest } from "@modules/recommendations/domain/IdeaWriter";
import type { SuggestOptionsRequest } from "@modules/recommendations/domain/OptionSuggester";

/** Modelo simulado: guarda lo que se le pide y contesta lo que el test diga (validado con el esquema, como el real). */
class ScriptedModel implements StructuredModel {
  readonly model = "modelo-de-prueba";
  readonly calls: { system: string; user: string }[] = [];
  private readonly answer: unknown;

  constructor(answer: unknown) {
    this.answer = answer;
  }

  async ask<T>(input: { system: string; user: string; schema: z.ZodType<T> }): Promise<T> {
    this.calls.push({ system: input.system, user: input.user });
    return input.schema.parse(this.answer);
  }
}

const REQUEST: IdeaRequest = {
  locale: "es",
  categoryKey: "economia",
  score: 3,
  trend: "down",
  helpfulThings: ["Llevar un presupuesto"],
  candidates: [{ templateKey: "economia.1", text: "Si te apetece, anota durante una semana en qué se va tu dinero." }],
};

describe("AnthropicIdeaWriter (RF-40b)", () => {
  it("devuelve el texto del modelo con la clave de la idea pedida (la clave no la decide el modelo)", async () => {
    const model = new ScriptedModel({ text: "Ya que te ayuda llevar un presupuesto, prueba a anotar una semana en qué se va tu dinero." });
    const writer = new AnthropicIdeaWriter(model);

    const draft = await writer.write(REQUEST);

    expect(draft).toEqual({ templateKey: "economia.1", text: "Ya que te ayuda llevar un presupuesto, prueba a anotar una semana en qué se va tu dinero." });
    expect(writer.model).toBe("modelo-de-prueba");
  });

  it("envía solo lo previsto: idioma, categoría, tendencia, puntuación, lo que ayuda y la idea", async () => {
    const model = new ScriptedModel({ text: "x".repeat(60) });

    await new AnthropicIdeaWriter(model).write(REQUEST);

    expect(JSON.parse(model.calls[0].user)).toEqual({
      language: "Spanish",
      category: "economia",
      score: 3,
      trend: "down",
      helpfulThings: ["Llevar un presupuesto"],
      idea: "Si te apetece, anota durante una semana en qué se va tu dinero.",
    });
  });

  it("RF-46: con profesión y aficiones, van como dos campos de datos más, al escritor y al revisor", async () => {
    const writerModel = new ScriptedModel({ text: "x".repeat(60) });
    const reviewerModel = new ScriptedModel({ approved: true, reasons: [] });
    const request: IdeaRequest = { ...REQUEST, occupation: "Desarrollo web", hobbies: ["Montaña", "Viajar"] };

    await new AnthropicIdeaWriter(writerModel).write(request);
    await new AnthropicIdeaReviewer(reviewerModel).review({ templateKey: "economia.1", text: "x".repeat(60) }, request);

    expect(JSON.parse(writerModel.calls[0].user)).toMatchObject({ occupation: "Desarrollo web", hobbies: ["Montaña", "Viajar"] });
    expect(JSON.parse(reviewerModel.calls[0].user)).toMatchObject({ occupation: "Desarrollo web", hobbies: ["Montaña", "Viajar"] });
    expect(writerModel.calls[0].system).toMatch(/Never assume anything about the person from their occupation/);
  });

  it("el prompt lleva las reglas: sin diagnósticos, sin consejo profesional o financiero, sin obligación ni juicio, sin citar la puntuación", async () => {
    const model = new ScriptedModel({ text: "x".repeat(60) });

    await new AnthropicIdeaWriter(model).write({ ...REQUEST, locale: "en" });

    const { system, user } = model.calls[0];
    for (const rule of [/diagnos/i, /medication|therapy/i, /financial product/i, /must|should|have to/i, /judg/i, /score/i, /40.*400|400 characters/i]) expect(system).toMatch(rule);
    expect(JSON.parse(user).language).toBe("English");
  });

  it("sin idea candidata no hay nada que reescribir: falla (y el caso de uso cae al texto curado)", async () => {
    const model = new ScriptedModel({ text: "x".repeat(60) });

    await expect(new AnthropicIdeaWriter(model).write({ ...REQUEST, candidates: [] })).rejects.toThrow();
    expect(model.calls).toHaveLength(0);
  });

  it("si el modelo contesta algo que no encaja con el esquema, falla", async () => {
    await expect(new AnthropicIdeaWriter(new ScriptedModel({ texto: "sin el campo esperado" })).write(REQUEST)).rejects.toThrow();
  });
});

describe("AnthropicIdeaReviewer (RF-40b)", () => {
  const draft = { templateKey: "economia.1", text: "Ya que te ayuda llevar un presupuesto, prueba a anotar una semana en qué se va tu dinero." };

  it("devuelve el veredicto del modelo, con sus motivos", async () => {
    const approved = await new AnthropicIdeaReviewer(new ScriptedModel({ approved: true, reasons: [] })).review(draft, REQUEST);
    const rejected = await new AnthropicIdeaReviewer(new ScriptedModel({ approved: false, reasons: ["tono de obligación"] })).review(draft, REQUEST);

    expect(approved).toEqual({ approved: true, reasons: [] });
    expect(rejected).toEqual({ approved: false, reasons: ["tono de obligación"] });
  });

  it("le enseña el borrador, la idea original y lo que el usuario dijo que le ayuda (para no tomarlo por un dato inventado); nada más", async () => {
    const model = new ScriptedModel({ approved: true, reasons: [] });

    await new AnthropicIdeaReviewer(model).review(draft, REQUEST);

    expect(JSON.parse(model.calls[0].user)).toEqual({ language: "Spanish", originalIdea: REQUEST.candidates[0].text, helpfulThings: ["Llevar un presupuesto"], draft: draft.text });
    expect(model.calls[0].system).toMatch(/helpfulThings/);
  });
});

describe("AnthropicOptionSuggester (RF-45, RF-40b)", () => {
  const request: SuggestOptionsRequest = {
    locale: "es",
    categoryKey: "vidaSocial",
    text: "Me agobian los sitios con mucha gente; prefiero planes tranquilos.",
    helps: [{ key: "vidaSocial.planesTranquilos", label: "Planes tranquilos" }],
    difficulties: [{ key: "sitiosConMuchaGente", label: "Sitios con mucha gente" }],
  };

  it("devuelve las claves que propone el modelo", async () => {
    const model = new ScriptedModel({ helps: ["vidaSocial.planesTranquilos"], difficulties: ["sitiosConMuchaGente"] });

    expect(await new AnthropicOptionSuggester(model).suggest(request)).toEqual({ helps: ["vidaSocial.planesTranquilos"], difficulties: ["sitiosConMuchaGente"] });
  });

  it("envía el texto (ya sin datos personales), la categoría y las opciones posibles; el prompt prohíbe valorar a la persona", async () => {
    const model = new ScriptedModel({ helps: [], difficulties: [] });

    await new AnthropicOptionSuggester(model).suggest(request);

    expect(JSON.parse(model.calls[0].user)).toEqual({ language: "Spanish", category: "vidaSocial", experience: request.text, helps: request.helps, difficulties: request.difficulties });
    expect(model.calls[0].system).toMatch(/only.*keys/i);
    expect(model.calls[0].system).toMatch(/do not assess|never assess/i);
    // SEC-04: lo que escribe el usuario es un dato, no una orden para el modelo.
    expect(model.calls[0].system).toMatch(/data, not instructions/i);
    expect(model.calls[0].system).toMatch(/do not follow/i);
  });
});
