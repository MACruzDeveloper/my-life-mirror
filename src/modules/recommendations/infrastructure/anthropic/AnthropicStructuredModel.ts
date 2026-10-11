import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { StructuredModel } from "./StructuredModel.js";

/** El Haiku actual: rápido y el más barato; suficiente para reescribir una frase o emparejar con una lista. */
export const ANTHROPIC_MODEL = "claude-haiku-5-5";

/** Margen para el razonamiento del modelo (cuenta como salida) más una respuesta corta. */
const MAX_TOKENS = 2000;
/** Por debajo del límite del caso de uso (8 s), para que la petición no siga viva (ni facturando) cuando ya nadie la espera. */
const TIMEOUT_MS = 7000;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

type MessagesClient = { messages: Pick<Anthropic["messages"], "parse"> };

/**
 * RF-40b: `StructuredModel` sobre la API de Anthropic. Esfuerzo bajo (son tareas
 * cortas) y salida estructurada: la respuesta llega ya validada contra el
 * esquema. Un rechazo del modelo o una respuesta que no encaja son errores, y
 * quien lo usa cae al texto curado. Sin reintentos: es mejor el texto curado
 * ahora que la idea personalizada tarde.
 */
export class AnthropicStructuredModel implements StructuredModel {
  readonly model = ANTHROPIC_MODEL;
  private readonly client: MessagesClient;
  private readonly onUsage?: (usage: TokenUsage) => void;

  constructor(client: MessagesClient, options: { onUsage?: (usage: TokenUsage) => void } = {}) {
    this.client = client;
    this.onUsage = options.onUsage;
  }

  async ask<T>({ system, user, schema }: { system: string; user: string; schema: z.ZodType<T> }): Promise<T> {
    const response = await this.client.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort: "low", format: zodOutputFormat(schema) },
    });
    this.onUsage?.({ inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });
    if (response.stop_reason === "refusal") throw new Error("El modelo ha rehusado la petición");
    if (response.parsed_output === null || response.parsed_output === undefined) throw new Error("La respuesta del modelo no encaja con el esquema");
    return response.parsed_output as T;
  }
}

/** El modelo real, con la clave del servidor. */
export function createAnthropicModel(apiKey: string, options: { onUsage?: (usage: TokenUsage) => void } = {}): AnthropicStructuredModel {
  return new AnthropicStructuredModel(new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 }), options);
}
