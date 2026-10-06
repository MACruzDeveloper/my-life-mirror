import { expect, test } from "@playwright/test";

/**
 * Primer test E2E del proyecto (V&V apartado 1). Deliberadamente limitado a lo que
 * no toca `api/` — un registro/login real de verdad crearía una cuenta real
 * en Supabase Auth en cada ejecución. Cubrir el flujo completo (RF-01) con
 * Playwright es la lección de apartado 1.1, pero necesita antes una decisión sobre
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

test.describe("Idioma en las páginas públicas (RNF-10)", () => {
  test("se puede pasar la portada a inglés antes de tener cuenta, y la elección se recuerda", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await page.getByRole("switch", { name: "English" }).click();

    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });
});

test.describe("Líneas de ayuda (RF-30)", () => {
  test("desde el pie de la portada, sin cuenta, se llega a las líneas de ayuda con sus números para llamar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("contentinfo").getByRole("link", { name: "¿Necesitas ayuda ahora?" }).click();

    await expect(page).toHaveURL(/\/ayuda$/);
    await expect(page.getByRole("heading", { level: 1, name: "¿Necesitas ayuda ahora?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Llamar al 024" })).toHaveAttribute("href", "tel:024");
    await expect(page.getByRole("link", { name: "Llamar al 112" })).toHaveAttribute("href", "tel:112");
    await expect(page.getByRole("link", { name: "Find A Helpline" })).toHaveAttribute("href", "https://findahelpline.com");
  });
});

test.describe("Capas CSS: el CSS propio gana a Material UI sin !important", () => {
  test("una regla sin capa se impone a la de MUI aunque tenga menos especificidad", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("link", { name: "Crear cuenta" });
    await expect(button).toHaveClass(/MuiButton-root/);
    await expect(button).not.toHaveCSS("text-transform", "lowercase");

    // Como si estuviera en skin.css: sin capa, sin !important y con especificidad cero (`:where`), menor
    // que la de MUI (una clase). Sin capas perdería siempre; con ellas gana por estar fuera de la capa `mui`.
    await page.addStyleTag({ content: ":where(.MuiButton-root) { text-transform: lowercase; }" });

    await expect(button).toHaveCSS("text-transform", "lowercase");
  });
});
