import { expect, test, type Request } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// PERF-01: el guardado devuelve las últimas puntuaciones y las recomendaciones; solo se vuelve a pedir el historial.
test.describe("PERF-01: menos llamadas al guardar en la entrevista", () => {
  test("guardar una categoría hace 2 peticiones (más la de la ventana de ideas, RF-43) y la idea nueva sale igual en el modal", async ({ page }) => {
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    // Activar recarga puntuaciones, historial y recomendaciones: se espera a que acabe para no contarlo.
    // (No vale `waitForLoadState("networkidle")`: ese estado se alcanza una vez al cargar y luego no espera.)
    const isGet = (path: string) => (response: { url(): string; request(): { method(): string } }) => new URL(response.url()).pathname === path && response.request().method() === "GET";
    const refreshAfterActivating = Promise.all(["/api/assessments", "/api/assessments/history", "/api/recommendations"].map((path) => page.waitForResponse(isGet(path))));
    await interview.activate("Finanzas");
    await refreshAfterActivating;

    // Las que se lanzan desde aquí, menos las abortadas: en desarrollo, StrictMode monta la ventana dos veces y
    // la primera lectura de la pestaña de RF-43 se aborta (AbortController); en producción no se lanza.
    // Una duplicada de verdad sí contaría.
    const requests = new Map<Request, string>();
    page.on("request", (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith("/api/")) requests.set(request, `${request.method()} ${pathname}`);
    });
    page.on("requestfailed", (request) => requests.delete(request));
    const historyAfterSaving = page.waitForResponse(isGet("/api/assessments/history"));
    await interview.score("Finanzas", 2);
    await interview.save("Finanzas");
    await expect(interview.savedIdeaDialog()).toContainText(/tienes una idea para finanzas/i);
    await historyAfterSaving;
    await page.waitForTimeout(500); // margen por si saliera alguna petición más, que haría fallar el test

    // El guardado sigue siendo 2 peticiones; la otra es de la ventana de ideas, una sola vez (luego, de la caché): lo
    // que comparten otras personas (RF-43). Lo que la persona decidió sobre sus ideas (RF-19) ya estaba en la caché:
    // lo pidió la campana de avisos de la cabecera al abrir la página.
    expect([...requests.values()].sort()).toEqual(["GET /api/assessments/history", "GET /api/categories/shared", "POST /api/assessments"]);
  });
});
