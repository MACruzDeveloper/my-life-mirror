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

  /** UX-07: en la primera entrevista, el botón de una categoría en el paso 2 (se marca al tocarlo). */
  categoryOption(name: string) {
    return this.page.locator("button[aria-pressed]").filter({ hasText: new RegExp(`^${name}`, "i") });
  }

  title() {
    return this.page.getByRole("heading", { level: 1, name: /^(tu entrevista|actualiza tus respuestas)$/i });
  }

  /** UX-07: pasa del paso 1 (introducción) al 2 (categorías) si está en él. */
  async startIfFirstTime() {
    // Antes, a que la entrevista termine de cargar (tras recargar o llegar desde Inicio aún sale el
    // indicador de carga). Por su título: el h1 de Inicio también vale para "un h1" mientras se navega.
    await expect(this.title()).toBeVisible();
    const start = this.page.getByRole("button", { name: "Empezar" });
    if (await start.isVisible()) await start.click();
  }

  isChoosingCategories() {
    return this.page.getByRole("heading", { name: "¿De qué quieres hablar?" }).isVisible();
  }

  /** UX-07: lleva a las preguntas desde cualquier paso (recargar la primera entrevista vuelve al paso 1). */
  async goToQuestions() {
    await this.startIfFirstTime();
    const next = this.page.getByRole("button", { name: "Ir a las preguntas" });
    if (await next.isVisible()) await next.click();
  }

  /** UX-06: al actualizar, las categorías van en acordeones plegados; los abre si hace falta. */
  async openCategories() {
    for (const title of [/^tus categorías/i, /^requieren tu consentimiento/i]) {
      const summary = this.page.getByRole("button", { name: title });
      if ((await summary.count()) > 0 && (await summary.getAttribute("aria-expanded")) === "false") await summary.click();
    }
  }

  async activate(name: string) {
    await this.startIfFirstTime();
    if (await this.isChoosingCategories()) {
      const option = this.categoryOption(name);
      if ((await option.getAttribute("aria-pressed")) !== "true") await option.click();
      await expect(option).toHaveAttribute("aria-pressed", "true");
      return;
    }
    await this.openCategories();
    await this.category(name).check();
    await expect(this.category(name)).toBeChecked();
  }

  consentDialog() {
    return this.page.getByRole("dialog");
  }

  async score(name: string, value: number) {
    await this.goToQuestions();
    await this.page.getByRole("group", { name: `Puntuación de ${name}` }).getByRole("button", { name: String(value), exact: true }).click();
  }

  /** La pregunta de una categoría (todo lo suyo: puntuación, experiencia, su "Guardar"). */
  question(name: string) {
    return this.page.locator(`[id^="pregunta-"]`).filter({ has: this.page.getByRole("group", { name: `Puntuación de ${name}` }) });
  }

  /** RF-41: abre "¿Qué te ayuda en esta área?" de una categoría y devuelve su grupo de opciones. */
  async openHelps(name: string) {
    await this.goToQuestions();
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
