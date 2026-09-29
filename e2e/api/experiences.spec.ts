import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

test.describe("RF-41: experiencias por categoría", () => {
  test("una opción de '¿Qué te ayuda?' se guarda al momento y sigue marcada al volver", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Economía");

    const helps = await interview.openHelps("Economía");
    // Esperar a que el servidor lo guarde antes de recargar (la espera se prepara antes del clic).
    const saved = page.waitForResponse((response) => response.url().endsWith("/api/categories/experience") && response.ok());
    await helps.getByRole("button", { name: "Llevar un presupuesto" }).click();
    await expect(helps.getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeVisible();
    await saved;

    await page.reload();
    const helpsAfter = await interview.openHelps("Economía");
    await expect(helpsAfter.getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeVisible();
    await expect(helpsAfter.getByRole("button", { name: "Apps de finanzas", pressed: false })).toBeVisible();
  });

  test("'Tu experiencia (privada)' explica que solo la ve el usuario", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Familia");

    await page.getByRole("button", { name: /tu experiencia \(privada\)/i }).click();
    await expect(page.getByText("Solo la ves tú. Nunca se envía a la IA ni se comparte con nadie.")).toBeVisible();
  });
});
