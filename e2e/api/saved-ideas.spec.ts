import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// RF-19: guardar una idea para no olvidarla, darla por hecha, o apartar la que no sirve.
test.describe("RF-19: guardar, hacer o descartar una idea", () => {
  test("una idea guardada en el carrusel aparece en Inicio, sigue tras recargar y sale al marcarla hecha", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    await new HomePage(page).startInterviewLink().click();
    const interview = new InterviewPage(page);
    await interview.activate("Finanzas");
    await interview.score("Finanzas", 2);
    await interview.save("Finanzas");

    const dialog = interview.savedIdeaDialog();
    await dialog.getByRole("button", { name: "Me gusta", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Me gusta", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("status")).toContainText("Se ha guardado la idea");

    const home = new HomePage(page);
    await home.open();
    const saved = page.getByRole("region", { name: "Tus ideas guardadas" });
    await expect(saved.getByRole("listitem")).toHaveCount(1);
    await expect(saved.getByRole("listitem")).toContainText("Finanzas");
    await page.reload();
    await expect(saved.getByRole("listitem")).toHaveCount(1);

    await saved.getByRole("button", { name: "Hecha" }).click();
    await expect(saved).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("region", { name: "Cómo leer esta página" }).or(page.getByRole("heading", { name: "Bienvenido" })).first()).toBeVisible();
    await expect(saved).toHaveCount(0);
  });

  test("'No me gusta' quita esa idea del carrusel de la categoría", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    await new HomePage(page).startInterviewLink().click();
    const interview = new InterviewPage(page);
    await interview.activate("Finanzas");
    await interview.score("Finanzas", 2);
    await interview.save("Finanzas");

    const dialog = interview.savedIdeaDialog();
    await expect(dialog).toContainText("1 de 5");
    await dialog.getByRole("button", { name: "No me gusta" }).click();

    await expect(dialog).toContainText("1 de 4");
  });

  test("el servidor rechaza una idea que no es de esa categoría", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const categories = await (await page.request.get("/api/categories")).json();
    const economy = (categories as { id: string; name: string }[]).find((category) => category.name === "Finanzas")!;

    const response = await page.request.post("/api/recommendations/reactions", { data: { categoryId: economy.id, templateKey: "familia.1", reaction: "saved" } });

    expect(response.status()).toBe(400);
  });
});

// La categoría Salud, añadida tras la segunda prueba con una usuaria: sensible, como Sexo y Espiritualidad.
test.describe("Salud: categoría sensible", () => {
  test("está en el catálogo y pide consentimiento al activarla", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.startIfFirstTime();

    await interview.categoryOption("Salud").click();

    await expect(interview.consentDialog()).toContainText(/datos sensibles/i);
  });
});
