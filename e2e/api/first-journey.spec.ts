import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// El recorrido de la validación (tareas 1-3), de extremo a extremo y con base de datos real (local).
test.describe("primer uso: registro → entrevista → panel", () => {
  test("RF-01 + RF-39: registrarse deja la sesión iniciada y lleva a la bienvenida (UX-01)", async ({ page }) => {
    const user = newUser();
    await new AccountPages(page).register(user);

    const home = new HomePage(page);
    await expect(home.startInterviewLink()).toBeVisible();
    await expect(page.getByRole("region", { name: "Cómo funciona" })).toBeVisible();
  });

  test("RF-10 + RF-14 + RF-15 + RF-18: puntuar tres áreas muestra el panel, el equilibrio y una idea para la más baja", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    await new HomePage(page).startInterviewLink().click();

    const interview = new InterviewPage(page);
    for (const name of ["Economía", "Familia", "Vida social"]) await interview.activate(name);
    await interview.score("Economía", 2);
    await interview.score("Familia", 8);
    await interview.score("Vida social", 6);
    // UX-05: cada área se guarda con su botón; la baja abre "Cambios guardados" con su idea.
    await interview.save("Economía");
    await expect(interview.savedIdeaDialog()).toContainText(/tienes una idea para economía/i);
    await expect(interview.savedIdeaDialog()).toContainText(/no sustituyen el asesoramiento/i);
    await interview.savedIdeaDialog().getByRole("button", { name: "Seguir aquí" }).click();
    await interview.save("Familia");
    await interview.save("Vida social");
    await expect(interview.savedIdeaDialog()).toHaveCount(0);

    const home = new HomePage(page);
    await home.open();
    await expect(home.categoryCard("Economía")).toContainText("2");
    await expect(home.categoryCard("Economía")).toContainText("Bajo");
    await expect(home.balanceCard()).toBeVisible();

    const idea = home.ideasSummary().getByRole("button", { name: "Idea para Economía" });
    await expect(idea).toBeVisible();
    await expect(home.ideasSummary().getByRole("button", { name: /familia/i })).toHaveCount(0);
    await idea.click();
    await expect(page.getByRole("dialog")).toContainText(/no sustituyen el asesoramiento/i);
  });

  test("RF-01: cerrar sesión y volver a entrar recupera los datos guardados", async ({ page }) => {
    const user = newUser();
    const account = new AccountPages(page);
    await account.register(user);

    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Familia");
    await interview.score("Familia", 7);
    await interview.save("Familia");

    await account.logout();
    await account.login(user);
    await expect(page).toHaveURL(/\/inicio$/);
    await expect(new HomePage(page).categoryCard("Familia")).toContainText("7");
  });

  test("RF-01: una contraseña incorrecta no entra y lo explica", async ({ page }) => {
    const user = newUser();
    const account = new AccountPages(page);
    await account.register(user);
    await account.logout();

    await account.login({ email: user.email, password: "no-es-la-clave" });
    await expect(page.getByRole("alert")).toContainText(/incorrectos/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("SEC-01: una contraseña débil no crea la cuenta y el formulario dice qué falta", async ({ page }) => {
    const account = new AccountPages(page);
    await page.goto("/registro");
    // Plegados hasta que hacen falta (o se pulsa el botón de información).
    await expect(page.getByRole("list", { name: /tu contraseña necesita/i })).toHaveCount(0);

    await account.tryToRegister({ ...newUser(), password: "Test1234!" });

    await expect(page.getByRole("list", { name: /tu contraseña necesita/i })).toBeVisible();

    await expect(page.getByRole("alert")).toContainText(/no cumple los requisitos/i);
    await expect(page.getByText(/contraseña muy común/i)).toBeVisible();
    await expect(page).toHaveURL(/\/registro$/);
  });

  test("SEC-01: el servidor rechaza una contraseña débil aunque no pase por el formulario, y un email repetido sin afirmar que existe", async ({ page, request }) => {
    const user = newUser();

    const weak = await request.post("/api/accounts/register", { data: { ...user, password: "Password1234!" } });
    expect(weak.status()).toBe(400);
    expect(await weak.json()).toMatchObject({ code: "WEAK_PASSWORD", rules: ["sequence", "common"] });

    await new AccountPages(page).register(user);
    const repeated = await request.post("/api/accounts/register", { data: user });
    expect(repeated.status()).toBe(400);
    const body = await repeated.json();
    expect(body.code).toBe("EMAIL_NOT_ACCEPTED");
    expect(body.error).not.toMatch(/ya existe/i);
  });

  test("SEC-03: una acción pedida desde otra web se rechaza", async ({ request }) => {
    const response = await request.post("/api/accounts/login", { data: { email: "a@example.com", password: "x" }, headers: { Origin: "https://otra-web.example" } });

    expect(response.status()).toBe(403);
  });
});
