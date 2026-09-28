import { expect, type Page } from "@playwright/test";
import type { TestUser } from "./users";

/** Registro, login y cierre de sesión (RF-01, RF-39). */
export class AccountPages {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async register(user: TestUser) {
    await this.page.goto("/registro");
    await this.page.getByLabel(/nombre/i).fill(user.name);
    await this.page.getByLabel(/email/i).fill(user.email);
    await this.page.getByLabel(/contraseña/i).fill(user.password);
    await this.page.getByRole("button", { name: "Registrarse" }).click();
    await expect(this.page).toHaveURL(/\/inicio$/);
  }

  async login(user: Pick<TestUser, "email" | "password">) {
    await this.page.goto("/login");
    await this.page.getByLabel(/email/i).fill(user.email);
    await this.page.getByLabel(/contraseña/i).fill(user.password);
    await this.page.getByRole("button", { name: "Iniciar sesión" }).click();
  }

  /** En móvil el botón vive en el menú de la cabecera (UX-03). */
  async logout() {
    const menu = this.page.getByRole("button", { name: /abrir menú/i });
    if (await menu.isVisible()) {
      await menu.click();
      await this.page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
    } else {
      await this.page.getByRole("button", { name: /cerrar sesión/i }).click();
    }
    await expect(this.page).toHaveURL(/\/(login)?$/);
  }
}
