import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// PERF-01: el guardado devuelve las últimas puntuaciones y las recomendaciones; solo se vuelve a pedir el historial.
test.describe("PERF-01: menos llamadas al guardar en la entrevista", () => {
  test("guardar una categoría hace 2 peticiones y la idea nueva sale igual en el modal", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    // Activar recarga puntuaciones, historial y recomendaciones: se espera a que acabe para no contarlo.
    // (No vale `waitForLoadState("networkidle")`: ese estado se alcanza una vez al cargar y luego no espera.)
    const isGet = (path: string) => (response: { url(): string; request(): { method(): string } }) => new URL(response.url()).pathname === path && response.request().method() === "GET";
    const refreshAfterActivating = Promise.all(["/api/assessments", "/api/assessments/history", "/api/recommendations"].map((path) => page.waitForResponse(isGet(path))));
    await interview.activate("Economía");
    await refreshAfterActivating;

    const requests: string[] = [];
    page.on("request", (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith("/api/")) requests.push(`${request.method()} ${pathname}`);
    });
    const historyAfterSaving = page.waitForResponse(isGet("/api/assessments/history"));
    await interview.score("Economía", 2);
    await interview.save("Economía");
    await expect(interview.savedIdeaDialog()).toContainText(/tienes una idea para economía/i);
    await historyAfterSaving;
    await page.waitForTimeout(500); // margen por si saliera alguna petición más, que haría fallar el test

    expect(requests.sort()).toEqual(["GET /api/assessments/history", "POST /api/assessments"]);
  });
});
