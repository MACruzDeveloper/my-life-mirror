import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { DataPrivacyPage } from "./pages/DataPrivacyPage";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// En local y en CI el proveedor es el *Fake* (AI_IDEAS_PROVIDER=fake, scripts/local-supabase.mjs).
test.describe("RF-40: ideas personalizadas con IA", () => {
  test("activada, la idea de un área baja sale personalizada con su etiqueta y la original; desactivada, vuelve la curada", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Economía");
    const helps = await interview.openHelps("Economía");
    await helps.getByRole("button", { name: "Llevar un presupuesto" }).click();
    await expect(helps.getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeVisible();
    await interview.score("Economía", 2);
    await interview.save("Economía");

    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    await expect(privacy.aiIdeasSwitch()).not.toBeChecked();
    await privacy.aiIdeasSwitch().click();
    await expect(privacy.aiIdeasSwitch()).toBeChecked();

    const home = new HomePage(page);
    await home.open();
    await home.ideasSummary().getByRole("button", { name: "Idea para Economía" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Personalizada con IA")).toBeVisible();
    await expect(dialog).toContainText("llevar un presupuesto");
    await expect(dialog).toContainText(/no sustituyen el asesoramiento/i);
    await dialog.getByRole("button", { name: "Ver la idea original" }).click();
    await expect(dialog).toContainText(/en qué se va tu dinero/i);
    // UX-05: carrusel con las demás ideas de la categoría, también personalizadas.
    await dialog.getByRole("button", { name: "Idea siguiente" }).click();
    await expect(dialog).toContainText("Idea 2 de 5");
    await expect(dialog).toContainText(/apartar una cantidad pequeña/i);
    await dialog.getByRole("button", { name: /cerrar/i }).click();

    // RF-40 v1.1: marcar otra opción de "¿Qué te ayuda?" reescribe la idea.
    await interview.open();
    const moreHelps = await interview.openHelps("Economía");
    await moreHelps.getByRole("button", { name: "Apps de finanzas" }).click();
    await expect(moreHelps.getByRole("button", { name: "Apps de finanzas", pressed: true })).toBeVisible();
    await interview.question("Economía").getByRole("button", { name: /^Ideas para Economía/ }).click();
    await expect(page.getByRole("dialog")).toContainText("apps de finanzas");
    await page.getByRole("dialog").getByRole("button", { name: /cerrar/i }).click();

    await privacy.open();
    await privacy.aiIdeasSwitch().click();
    await expect(privacy.aiIdeasSwitch()).not.toBeChecked();
    await home.open();
    await home.ideasSummary().getByRole("button", { name: "Idea para Economía" }).click();
    await expect(page.getByRole("dialog")).toContainText(/en qué se va tu dinero/i);
    await expect(page.getByRole("dialog").getByText("Personalizada con IA")).toHaveCount(0);
  });
});
