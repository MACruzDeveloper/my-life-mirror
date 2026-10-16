import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { newUser } from "./pages/users";

// RF-49: hitos en las páginas de Aventura y Deporte (migración 0031).
test.describe("RF-49: hitos", () => {
  test("Deporte tiene página; un hito se guarda, sigue tras recargar, no sale en Aventura y se borra", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    await page.goto("/categorias");
    await page.getByRole("link", { name: /Deporte/ }).click();

    await expect(page).toHaveURL(/\/categorias\/deporte$/);
    await expect(page.getByRole("heading", { level: 1, name: "Deporte" })).toBeVisible();
    const milestones = page.getByRole("region", { name: "Carreras, competiciones y marcas" });
    await milestones.getByRole("textbox", { name: /Qué conseguiste/ }).fill("Media maratón de Valencia");
    await milestones.getByRole("combobox", { name: "Año" }).click();
    await page.getByRole("option", { name: "2024", exact: true }).click();
    await milestones.getByRole("combobox", { name: /Mes/ }).click();
    await page.getByRole("option", { name: "noviembre" }).click();
    await milestones.getByRole("button", { name: "Añadir hito" }).click();
    await expect(milestones.getByRole("listitem").filter({ hasText: "Media maratón de Valencia" })).toContainText("noviembre de 2024");

    await page.reload();
    await expect(milestones.getByRole("listitem").filter({ hasText: "Media maratón de Valencia" })).toBeVisible();

    await page.goto("/categorias/aventura");
    const challenges = page.getByRole("region", { name: "Retos superados" });
    await expect(challenges.getByText("Todavía no has añadido ningún hito.")).toBeVisible();

    await page.goto("/categorias/deporte");
    await milestones.getByRole("button", { name: /Borrar «Media maratón de Valencia»/ }).click();
    await expect(milestones.getByText("Todavía no has añadido ningún hito.")).toBeVisible();
  });

  test("el servidor solo acepta categorías con hitos, títulos de 1 a 80 caracteres y años que ya pasaron", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const nextYear = new Date().getFullYear() + 1;

    for (const data of [
      { categoryKey: "economia", title: "Ahorré", year: 2020 },
      { categoryKey: "deporte", title: "   ", year: 2020 },
      { categoryKey: "deporte", title: "x".repeat(81), year: 2020 },
      { categoryKey: "deporte", title: "Futuro", year: nextYear },
      { categoryKey: "deporte", title: "Mes", year: 2020, month: 13 },
    ]) {
      expect((await page.request.post("/api/agenda/milestones", { data })).status(), JSON.stringify(data)).toBe(400);
    }
    const created = await page.request.post("/api/agenda/milestones", { data: { categoryKey: "deporte", title: "Primer 10K", year: 2019 } });
    expect(created.status()).toBe(201);
    expect(await created.json()).toMatchObject({ categoryKey: "deporte", title: "Primer 10K", year: 2019 });
  });
});
