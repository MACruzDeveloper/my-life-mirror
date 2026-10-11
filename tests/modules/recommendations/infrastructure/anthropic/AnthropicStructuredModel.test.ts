import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ANTHROPIC_MODEL, AnthropicStructuredModel } from "@modules/recommendations/infrastructure/anthropic/AnthropicStructuredModel";

const Schema = z.object({ text: z.string() });

/** Cliente simulado del SDK: devuelve lo que diga el test y guarda la petición. */
function fakeClient(response: unknown) {
  const parse = vi.fn<(request: unknown) => Promise<unknown>>(async () => response);
  return { client: { messages: { parse } } as never, parse };
}

const usage = { input_tokens: 120, output_tokens: 40 };

describe("AnthropicStructuredModel (RF-40b)", () => {
  it("pide a Claude Haiku 5.5, con esfuerzo bajo y salida con esquema, y devuelve la respuesta ya validada", async () => {
    const { client, parse } = fakeClient({ stop_reason: "end_turn", parsed_output: { text: "hola" }, usage });
    const model = new AnthropicStructuredModel(client);

    const answer = await model.ask({ system: "reglas", user: "{}", schema: Schema });

    expect(answer).toEqual({ text: "hola" });
    expect(model.model).toBe("claude-haiku-5-5");
    const request = parse.mock.calls[0][0] as { output_config: { format: unknown } };
    expect(request).toMatchObject({ model: ANTHROPIC_MODEL, system: "reglas", messages: [{ role: "user", content: "{}" }], output_config: { effort: "low" } });
    expect(request.output_config.format).toBeDefined();
  });

  it("si el modelo rehúsa, falla (se verá el texto curado)", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", parsed_output: null, usage });

    await expect(new AnthropicStructuredModel(client).ask({ system: "s", user: "u", schema: Schema })).rejects.toThrow(/rehusado/);
  });

  it("si la respuesta no encaja con el esquema, falla", async () => {
    const { client } = fakeClient({ stop_reason: "end_turn", parsed_output: null, usage });

    await expect(new AnthropicStructuredModel(client).ask({ system: "s", user: "u", schema: Schema })).rejects.toThrow(/esquema/);
  });

  it("avisa del consumo de cada llamada (para medir el coste en la evaluación)", async () => {
    const { client } = fakeClient({ stop_reason: "end_turn", parsed_output: { text: "hola" }, usage });
    const seen: unknown[] = [];

    await new AnthropicStructuredModel(client, { onUsage: (tokens) => seen.push(tokens) }).ask({ system: "s", user: "u", schema: Schema });

    expect(seen).toEqual([{ inputTokens: 120, outputTokens: 40 }]);
  });
});
