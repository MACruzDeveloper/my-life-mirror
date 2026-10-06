import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { DataPrivacyPage } from "./pages/DataPrivacyPage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// En local y en CI el proveedor es el *Fake* (palabras clave → opciones, AI_IDEAS_PROVIDER=fake).
test.describe("RF-45: la IA propone opciones a partir de una experiencia", () => {
  test("activada, una experiencia propone una situación; aceptarla la marca y se conserva", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    await expect(privacy.aiSuggestionsSwitch()).not.toBeChecked();
    await privacy.aiSuggestionsSwitch().click();
    await expect(privacy.aiSuggestionsSwitch()).toBeChecked();

    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Vida social");
    await interview.score("Vida social", 3);
    await interview.save("Vida social");
    // Con un 3 se abre una idea nueva y, con ella, "Cambios guardados".
    await interview.savedIdeaDialog().getByRole("button", { name: "Seguir aquí" }).click();
    const question = interview.question("Vida social");
    await question.getByRole("button", { name: /tus experiencias/i }).click();
    await question.getByLabel("Nueva experiencia").fill("Me agobian los sitios con mucha gente");
    await question.getByRole("button", { name: "Añadir" }).click();
    await expect(question.getByRole("list", { name: /tus experiencias/i })).toContainText("Me agobian los sitios con mucha gente");

    const saved = page.waitForResponse((response) => response.url().endsWith("/api/categories/difficulties") && response.ok());
    await question.getByRole("button", { name: "Sugerir opciones con IA" }).click();
    await expect(question.getByText("Sugerido por IA")).toBeVisible();
    await question.getByRole("button", { name: "Marcar «Sitios con mucha gente»" }).click();
    await saved;

    await page.reload();
    const difficulties = await interview.openDifficulties("Vida social");
    await expect(difficulties.getByRole("button", { name: "Sitios con mucha gente", pressed: true })).toBeVisible();
  });

  test("sin activarla, no se ofrece", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Vida social");
    await interview.goToQuestions();
    const question = interview.question("Vida social");
    await question.getByRole("button", { name: /tus experiencias/i }).click();
    await question.getByLabel("Nueva experiencia").fill("Me agobian los sitios con mucha gente");
    await question.getByRole("button", { name: "Añadir" }).click();
    await expect(question.getByRole("list", { name: /tus experiencias/i })).toContainText("Me agobian");

    await expect(question.getByRole("button", { name: "Sugerir opciones con IA" })).toHaveCount(0);
  });

  test("Pareja está excluida de la IA: aunque estén activadas, sus experiencias no lo ofrecen", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    await privacy.aiSuggestionsSwitch().click();
    await expect(privacy.aiSuggestionsSwitch()).toBeChecked();

    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Pareja");
    await interview.goToQuestions();
    const question = interview.question("Pareja");
    await question.getByRole("button", { name: /tus experiencias/i }).click();
    await question.getByLabel("Nueva experiencia").fill("Nos cuesta hablar de las cosas");
    await question.getByRole("button", { name: "Añadir" }).click();
    await expect(question.getByRole("list", { name: /tus experiencias/i })).toContainText("Nos cuesta hablar");

    await expect(question.getByRole("button", { name: "Sugerir opciones con IA" })).toHaveCount(0);
  });
});
