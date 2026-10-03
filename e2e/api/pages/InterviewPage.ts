import { expect, type Page } from "@playwright/test";

/** La entrevista (RF-10) con sus categorías (RF-06/07) y el consentimiento (RF-04). */
export class InterviewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/perfil/entrevista");
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  category(name: string) {
    return this.page.getByRole("checkbox", { name: new RegExp(`^${name}`, "i") });
  }

  async activate(name: string) {
    await this.category(name).check();
    await expect(this.category(name)).toBeChecked();
  }

  consentDialog() {
    return this.page.getByRole("dialog");
  }

  async score(name: string, value: number) {
    await this.page.getByRole("group", { name: `Puntuación de ${name}` }).getByRole("button", { name: String(value), exact: true }).click();
  }

  /** La pregunta de una categoría (todo lo suyo: puntuación, experiencia, su "Guardar"). */
  question(name: string) {
    return this.page.locator(`[id^="pregunta-"]`).filter({ has: this.page.getByRole("group", { name: `Puntuación de ${name}` }) });
  }

  /** RF-41: abre "¿Qué te ayuda en esta área?" de una categoría y devuelve su grupo de opciones. */
  async openHelps(name: string) {
    await this.question(name).getByRole("button", { name: /qué te ayuda en esta área/i }).click();
    return this.page.getByRole("group", { name: new RegExp(`qué te ayuda en esta área\\? ${name}`, "i") });
  }

  /** UX-05: "Cambios guardados", que se abre solo si el guardado abre una idea nueva. */
  savedIdeaDialog() {
    return this.page.getByRole("dialog", { name: "Cambios guardados" });
  }

  /** UX-05: guarda una categoría con su botón; termina con "Guardado ahora" o con la ventana de la idea. */
  async save(name: string) {
    await this.page.getByRole("button", { name: `Guardar ${name}`, exact: true }).click();
    await expect(this.question(name).getByRole("status").or(this.savedIdeaDialog())).toBeVisible();
  }
}
