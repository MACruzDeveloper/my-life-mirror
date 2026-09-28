import { type Page } from "@playwright/test";

/** Inicio: bienvenida de primera vez o panel (RF-14, RF-15, RF-16, RF-18, UX-01, UX-02). */
export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/inicio");
  }

  startInterviewLink() {
    return this.page.getByRole("link", { name: "Empezar mi entrevista" });
  }

  categoryCard(name: string) {
    return this.page.getByRole("region", { name, exact: true });
  }

  ideasSummary() {
    return this.page.getByRole("region", { name: "Ideas para ti" });
  }

  balanceCard() {
    return this.page.getByRole("region", { name: /tu equilibrio/i });
  }
}
