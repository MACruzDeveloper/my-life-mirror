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

  async save() {
    await this.page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(this.page.getByText(/cambios guardados/i)).toBeVisible();
  }
}
