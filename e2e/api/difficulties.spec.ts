import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

test.describe("RF-42: situaciones que lo ponen difícil", () => {
  test("marcar una situación quita del carrusel las ideas que chocan y se conserva al volver", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Finanzas");
    await interview.score("Finanzas", 2);
    await interview.save("Finanzas");
    await interview.savedIdeaDialog().getByRole("button", { name: "Seguir aquí" }).click();

    const difficulties = await interview.openDifficulties("Finanzas");
    const saved = page.waitForResponse((response) => response.url().endsWith("/api/categories/difficulties") && response.ok());
    await difficulties.getByRole("button", { name: "Apuntar cosas o llevar registros" }).click();
    await saved;

    await interview.question("Finanzas").getByRole("button", { name: /^Ideas para Finanzas/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Idea 1 de 3");
    for (let step = 0; step < 3; step += 1) {
      await expect(dialog).not.toContainText(/en qué se va tu dinero|objetivo de ahorro concreto/i);
      await dialog.getByRole("button", { name: "Idea siguiente" }).click();
    }
    await dialog.getByRole("button", { name: /cerrar/i }).click();

    await page.reload();
    const afterReload = await interview.openDifficulties("Finanzas");
    await expect(afterReload.getByRole("button", { name: "Apuntar cosas o llevar registros", pressed: true })).toBeVisible();
  });
});
