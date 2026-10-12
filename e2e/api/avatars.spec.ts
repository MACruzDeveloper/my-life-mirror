import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { newUser } from "./pages/users";

// RF-26: el avatar se elige en "Mi perfil", de un catálogo cerrado, y se puede quitar.
test.describe("RF-26: avatar del catálogo", () => {
  test("se elige en el perfil, se conserva al recargar y se puede quitar", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    await page.goto("/perfil");

    const picker = page.getByRole("radiogroup", { name: /tu avatar/i });
    await expect(picker.getByRole("radio")).toHaveCount(13); // doce avatares y "Sin avatar"
    await expect(picker.getByRole("radio", { name: /sin avatar/i })).toBeChecked();

    await picker.getByRole("radio", { name: /dos trenzas largas/i }).click();
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/perfil guardado/i)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("radiogroup", { name: /tu avatar/i }).getByRole("radio", { name: /dos trenzas largas/i })).toBeChecked();
    // La imagen se sirve de verdad (no un 404 que el navegador tape con las iniciales).
    const image = page.getByRole("radiogroup", { name: /tu avatar/i }).getByRole("img", { name: /dos trenzas largas/i });
    await expect(image).toHaveJSProperty("naturalWidth", 256);

    await page.getByRole("radiogroup", { name: /tu avatar/i }).getByRole("radio", { name: /sin avatar/i }).click();
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/perfil guardado/i)).toBeVisible();
    await page.reload();
    await expect(page.getByRole("radiogroup", { name: /tu avatar/i }).getByRole("radio", { name: /sin avatar/i })).toBeChecked();
  });

  test("el servidor rechaza un avatar que no está en el catálogo", async ({ page }) => {
    await new AccountPages(page).register(newUser());

    const response = await page.request.post("/api/accounts/profile", { data: { avatarKey: "inventado" } });

    expect(response.status()).toBe(400);
  });
});
