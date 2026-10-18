import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

test.describe("RF-41: experiencias por categoría", () => {
  test("una opción de '¿Qué te ayuda?' se guarda al momento y sigue marcada al volver", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Finanzas");

    const helps = await interview.openHelps("Finanzas");
    // Esperar a que el servidor lo guarde antes de recargar (la espera se prepara antes del clic).
    const saved = page.waitForResponse((response) => response.url().endsWith("/api/categories/experience") && response.ok());
    await helps.getByRole("button", { name: "Llevar un presupuesto" }).click();
    await expect(helps.getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeVisible();
    await saved;

    await page.reload();
    const helpsAfter = await interview.openHelps("Finanzas");
    await expect(helpsAfter.getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeVisible();
    await expect(helpsAfter.getByRole("button", { name: "Apps de finanzas", pressed: false })).toBeVisible();
  });

  test("RF-44: una experiencia se añade sin puntuar, sigue al volver y se puede borrar", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Familia");
    await interview.goToQuestions();
    const question = interview.question("Familia");

    await question.getByRole("button", { name: /tus experiencias/i }).click();
    await expect(question.getByText("Solo las ves tú. Nunca se envían a la IA ni se comparten con nadie.")).toBeVisible();
    await question.getByLabel("Nueva experiencia").fill("Cenamos juntos el domingo");
    await question.getByRole("button", { name: "Añadir" }).click();
    await expect(question.getByRole("status").filter({ hasText: "Guardada" })).toBeAttached();
    await expect(question.getByRole("list", { name: /tus experiencias/i })).toContainText("Cenamos juntos el domingo");

    await page.reload();
    await interview.goToQuestions();
    const diary = interview.question("Familia").getByRole("list", { name: /tus experiencias/i });
    await expect(diary).toContainText("Cenamos juntos el domingo");

    await interview.question("Familia").getByRole("button", { name: /^Borrar la experiencia del/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Borrar" }).click();
    await expect(interview.question("Familia").getByRole("list", { name: /tus experiencias/i })).toHaveCount(0);
    await page.reload();
    await interview.goToQuestions();
    await expect(interview.question("Familia").getByText("Cenamos juntos el domingo")).toHaveCount(0);
  });
});
