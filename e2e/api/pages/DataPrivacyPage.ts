import { type Page } from "@playwright/test";

/** Privacidad y datos: exportar y eliminar la cuenta (RF-05). */
export class DataPrivacyPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/perfil/datos");
  }

  async exportData() {
    const download = this.page.waitForEvent("download");
    await this.page.getByRole("button", { name: "Descargar mis datos" }).click();
    return download;
  }

  async deleteAccount(password: string) {
    await this.page.getByRole("button", { name: "Eliminar mi cuenta" }).click();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByLabel(/contraseña/i).fill(password);
    await dialog.getByRole("button", { name: "Eliminar definitivamente" }).click();
  }
}
