import { expect, test } from "@playwright/test";

/**
 * Primer test E2E del proyecto (V&V §1). Deliberadamente limitado a lo que
 * no toca `api/` — un registro/login real de verdad crearía una cuenta real
 * en Supabase Auth en cada ejecución. Cubrir el flujo completo (RF-01) con
 * Playwright es la lección de §1bis, pero necesita antes una decisión sobre
 * cómo aislar los datos de prueba (proyecto de Supabase dedicado, o
 * limpieza tras cada test) — no asumida aquí, ver AGENTS.md/pregunta al usuario.
 */
test.describe("Landing pública", () => {
  test("muestra la introducción y enlaza a registro e inicio de sesión", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "MyLifeMirror" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  test("el enlace de registro navega al formulario con los campos esperados", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL("/registro");
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });

  test("la política de privacidad es alcanzable y muestra la versión vigente", async ({ page }) => {
    await page.goto("/politica-privacidad");

    await expect(page.getByRole("heading", { name: "Política de privacidad" })).toBeVisible();
    await expect(page.getByText(/versión 2026-09/i)).toBeVisible();
  });
});
