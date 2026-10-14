import { expect, type Page } from "@playwright/test";
import type { TestUser } from "./users";

/** Punto de corte `sm` de MUI (600 px): por debajo, la cabecera usa el menú. */
const MUI_SM_BREAKPOINT = 600;

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
    await this.passwordField().fill(user.password);
    await this.page.getByRole("button", { name: "Registrarse" }).click();
    await expect(this.page).toHaveURL(/\/inicio$/);
  }

  /** Rellena el registro y lo envía, sin esperar que salga bien (para probar los rechazos). */
  async tryToRegister(user: TestUser) {
    await this.page.goto("/registro");
    await this.page.getByLabel(/nombre/i).fill(user.name);
    await this.page.getByLabel(/email/i).fill(user.email);
    await this.passwordField().fill(user.password);
    await this.page.getByRole("button", { name: "Registrarse" }).click();
  }

  /** El campo, no el botón "Mostrar la contraseña" que lleva al lado. */
  private passwordField() {
    return this.page.getByLabel(/^contraseña/i);
  }

  async login(user: Pick<TestUser, "email" | "password">) {
    await this.page.goto("/login");
    await this.page.getByLabel(/email/i).fill(user.email);
    await this.page.getByLabel(/contraseña/i).fill(user.password);
    await this.page.getByRole("button", { name: "Iniciar sesión" }).click();
  }

  /**
   * En móvil el botón vive en el menú de la cabecera (UX-03). Se decide por el
   * ancho de la pantalla (el mismo punto de corte que usa `Header`, `sm` de MUI)
   * y no mirando qué botón se ve: justo después de registrarse la cabecera puede
   * no haberse pintado todavía, y `isVisible()` no espera (fallo real en CI).
   */
  async logout() {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < MUI_SM_BREAKPOINT;
    if (isMobile) {
      await this.page.getByRole("button", { name: /abrir menú/i }).click();
      await this.page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
    } else {
      // En escritorio, cerrar sesión está en el menú de la cuenta (avatar y nombre).
      await this.page.getByRole("group", { name: "Mi cuenta" }).getByRole("button").click();
      await this.page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
    }
    await expect(this.page).toHaveURL(/\/(login)?$/);
  }
}
