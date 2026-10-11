import { z } from "zod";
import type { IdeaDraft, IdeaRequest, IdeaReviewer, IdeaWriter } from "../../domain/IdeaWriter.js";
import type { OptionSuggester, OptionSuggestion, SuggestOptionsRequest } from "../../domain/OptionSuggester.js";
import { LANGUAGE_NAMES, REVIEWER_SYSTEM, SUGGESTER_SYSTEM, WRITER_SYSTEM } from "./prompts.js";
import type { StructuredModel } from "./StructuredModel.js";

const DraftSchema = z.object({ text: z.string() });
const ReviewSchema = z.object({ approved: z.boolean(), reasons: z.array(z.string()) });
const SuggestionSchema = z.object({ helps: z.array(z.string()), difficulties: z.array(z.string()) });

/**
 * RF-40b: el escritor real. Reescribe la idea candidata (una: la que el usuario
 * está viendo). La clave de la idea no la decide el modelo: es la de la
 * candidata. El mensaje lleva solo los campos de `IdeaRequest`; el filtro y el
 * revisor se aplican después, en el caso de uso.
 */
export class AnthropicIdeaWriter implements IdeaWriter {
  readonly model: string;
  private readonly llm: StructuredModel;

  constructor(llm: StructuredModel) {
    this.llm = llm;
    this.model = llm.model;
  }

  async write(request: IdeaRequest): Promise<IdeaDraft> {
    const [candidate] = request.candidates;
    if (!candidate) throw new Error("No hay idea candidata que reescribir");
    const { text } = await this.llm.ask({
      system: WRITER_SYSTEM,
      user: JSON.stringify({
        language: LANGUAGE_NAMES[request.locale],
        category: request.categoryKey,
        score: request.score,
        trend: request.trend,
        helpfulThings: request.helpfulThings,
        idea: candidate.text,
      }),
      schema: DraftSchema,
    });
    return { templateKey: candidate.templateKey, text };
  }
}

/** RF-40b: segunda pasada del modelo sobre el borrador. Ve el borrador, la idea original y lo que al usuario le ayuda. */
export class AnthropicIdeaReviewer implements IdeaReviewer {
  private readonly llm: StructuredModel;

  constructor(llm: StructuredModel) {
    this.llm = llm;
  }

  async review(draft: IdeaDraft, request: IdeaRequest): Promise<{ approved: boolean; reasons: string[] }> {
    const original = request.candidates.find((candidate) => candidate.templateKey === draft.templateKey) ?? request.candidates[0];
    return this.llm.ask({
      system: REVIEWER_SYSTEM,
      // Con lo que le ayuda: sin ello, el revisor tomaba "ya que caminar te sienta bien" por un dato inventado (evaluación del 11 oct.).
      user: JSON.stringify({ language: LANGUAGE_NAMES[request.locale], originalIdea: original?.text ?? "", helpfulThings: request.helpfulThings, draft: draft.text }),
      schema: ReviewSchema,
    });
  }
}

/**
 * RF-45 con el modelo real: traduce una experiencia a las listas cerradas. Lo que
 * devuelva se valida otra vez en el caso de uso (solo claves de las opciones enviadas).
 */
export class AnthropicOptionSuggester implements OptionSuggester {
  private readonly llm: StructuredModel;

  constructor(llm: StructuredModel) {
    this.llm = llm;
  }

  async suggest(request: SuggestOptionsRequest): Promise<OptionSuggestion> {
    return this.llm.ask({
      system: SUGGESTER_SYSTEM,
      user: JSON.stringify({ language: LANGUAGE_NAMES[request.locale], category: request.categoryKey, experience: request.text, helps: request.helps, difficulties: request.difficulties }),
      schema: SuggestionSchema,
    });
  }
}
