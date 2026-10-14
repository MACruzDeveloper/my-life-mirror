import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { newUser } from "./pages/users";

/** Los países pintados como visitados (el azul de acento, Country Blue). */
const VISITED_FILL = 'path.leaflet-interactive[fill="#5F929C"]';

// RF-49: páginas de categoría; la primera, Aventura, con los viajes en un mapa de países.
test.describe("RF-49: Categorías y viajes en Aventura", () => {
  test("desde la cabecera a Aventura; un viaje a Myanmar pinta Myanmar, sigue tras recargar y se borra", async ({ page }, testInfo) => {
    // El mapa no pide nada fuera de la app: cualquier petición a otro dominio haría fallar el test.
    const external: string[] = [];
    page.on("request", (request) => {
      const { hostname } = new URL(request.url());
      if (!["localhost", "127.0.0.1"].includes(hostname)) external.push(request.url());
    });
    await new AccountPages(page).register(newUser());

    // En móvil, la navegación de la cabecera está dentro de su menú.
    const header = page.getByRole("banner");
    if (testInfo.project.name !== "mobile") {
      await header.getByRole("link", { name: "Categorías" }).click();
    } else {
      await header.getByRole("button", { name: /menú/i }).click();
      await page.getByRole("menuitem", { name: "Categorías" }).click();
    }
    await expect(page.getByRole("heading", { level: 1, name: "Categorías" })).toBeVisible();
    await expect(page.locator("[aria-disabled='true']").filter({ hasText: "Economía" })).toContainText("Próximamente");
    await page.getByRole("link", { name: /Aventura/ }).click();

    await expect(page).toHaveURL(/\/categorias\/aventura$/);
    await expect(page.getByRole("heading", { level: 1, name: "Aventura" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("Categorías/Aventura");
    const trips = page.getByRole("region", { name: "Tus viajes" });
    const map = trips.getByRole("group", { name: "Mapa de tus viajes" });
    await expect(map.locator("path.leaflet-interactive").first()).toBeAttached();
    await expect(map.locator(VISITED_FILL)).toHaveCount(0);

    await trips.getByRole("combobox", { name: "País" }).fill("Myan");
    await page.getByRole("option", { name: /Myanmar/ }).click();
    await trips.getByRole("combobox", { name: "Año" }).click();
    await page.getByRole("option", { name: "2015", exact: true }).click();
    await trips.getByRole("button", { name: "Añadir viaje" }).click();

    await expect(trips.getByRole("listitem").filter({ hasText: "Myanmar" })).toContainText("2015");
    await expect(map.locator(VISITED_FILL)).toHaveCount(1);

    await page.reload();
    await expect(trips.getByRole("listitem").filter({ hasText: "Myanmar" })).toBeVisible();
    await expect(map.locator(VISITED_FILL)).toHaveCount(1);
    // Al pasar por encima del país pintado, su nombre y cuándo fue.
    await map.locator(VISITED_FILL).dispatchEvent("mouseover");
    await expect(page.locator(".leaflet-tooltip")).toContainText("2015");

    await trips.getByRole("button", { name: /Borrar el viaje a Myanmar/ }).click();
    await expect(trips.getByText("Todavía no has añadido ningún viaje.")).toBeVisible();
    await expect(map.locator(VISITED_FILL)).toHaveCount(0);
    expect(external).toEqual([]);
  });

  test("el servidor solo acepta países de la lista, años en rango y meses que existen", async ({ page }) => {
    await new AccountPages(page).register(newUser());

    for (const data of [{ countryCode: "ZZ", year: 2015 }, { countryCode: "Myanmar", year: 2015 }, { countryCode: "MM", year: 1800 }, { countryCode: "MM", year: 2015, month: 13 }]) {
      expect((await page.request.post("/api/agenda/trips", { data })).status(), JSON.stringify(data)).toBe(400);
    }
    const created = await page.request.post("/api/agenda/trips", { data: { countryCode: "MM", year: 2015, month: 6 } });
    expect(created.status()).toBe(201);
    expect(await created.json()).toMatchObject({ countryCode: "MM", year: 2015, month: 6 });
  });
});
