import type { IdeaDraft, IdeaRequest, IdeaReviewer, IdeaWriter } from "../domain/IdeaWriter.js";

/**
 * RF-40a: escritor determinista para desarrollo local, E2E y tests, mientras no
 * hay crédito de API (RF-40b traerá el de Anthropic). Elige la primera idea del
 * catálogo y la antepone con lo que le ayuda al usuario, sin inventar nada.
 */
export class FakeIdeaWriter implements IdeaWriter {
  readonly model = "fake";

  async write(request: IdeaRequest): Promise<IdeaDraft> {
    const candidate = request.candidates[0];
    const helpful = request.helpfulThings[0];
    const lead = helpful ? (request.locale === "es" ? `Ya que te ayuda «${helpful.toLowerCase()}»: ` : `Since "${helpful.toLowerCase()}" helps you: `) : "";
    return { templateKey: candidate.templateKey, text: `${lead}${candidate.text}` };
  }
}

/** Revisor del *Fake*: aprueba siempre (el filtro determinista sigue aplicándose). */
export class FakeIdeaReviewer implements IdeaReviewer {
  async review(): Promise<{ approved: boolean; reasons: string[] }> {
    return { approved: true, reasons: [] };
  }
}
