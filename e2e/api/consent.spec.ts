import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

test.describe("RF-04: consentimiento de las categorías sensibles", () => {
  test("activar una categoría sensible pide consentimiento y, al aceptar, queda activa", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.startIfFirstTime();

    // UX-07: en la primera entrevista, las categorías se eligen en el paso 2, con botones.
    await interview.categoryOption("Espiritualidad").click();
    const dialog = interview.consentDialog();
    await expect(dialog).toContainText(/datos sensibles/i);
    await expect(dialog.getByRole("link", { name: /política de privacidad/i })).toBeVisible();
    await dialog.getByRole("button", { name: "Aceptar y activar" }).click();

    await expect(interview.categoryOption("Espiritualidad")).toHaveAttribute("aria-pressed", "true");
    // Persistido en el servidor, no solo en pantalla.
    await page.reload();
    await interview.startIfFirstTime();
    await expect(interview.categoryOption("Espiritualidad")).toHaveAttribute("aria-pressed", "true");
  });

  test("cancelar deja la categoría sin activar", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.startIfFirstTime();

    await interview.categoryOption("Espiritualidad").click();
    await interview.consentDialog().getByRole("button", { name: "Cancelar" }).click();

    await expect(interview.categoryOption("Espiritualidad")).toHaveAttribute("aria-pressed", "false");
    await page.reload();
    await interview.startIfFirstTime();
    await expect(interview.categoryOption("Espiritualidad")).toHaveAttribute("aria-pressed", "false");
  });
});
