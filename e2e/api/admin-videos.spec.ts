import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { newUser } from "./pages/users";

/**
 * Una cuenta de administración en el Supabase local: el rol solo se concede con la clave de servicio,
 * nunca desde la app (RNF-13). Estas variables las pone `npm run test:e2e:api`, y solo apuntan a la base local.
 */
async function createAdmin() {
  const user = newUser();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password, email_confirm: true, app_metadata: { rol: "admin" } }),
  });
  expect(response.ok).toBe(true);
  return user;
}

// ADM-04: los vídeos de inspiración se gestionan desde el panel, por categoría e idioma.
test("administración añade un vídeo en español a Deporte, se ve en su página y, al quitarlo, desaparece", async ({ page }, testInfo) => {
  // Toca datos globales (los vídeos de Deporte): una sola vez, no a la vez en móvil y en escritorio.
  test.skip(testInfo.project.name === "mobile", "datos globales: se prueba una vez");
  const youtubeId = randomUUID().replaceAll("-", "").slice(0, 11);
  await new AccountPages(page).login(await createAdmin());
  await page.waitForURL(/\/(inicio|perfil)/);
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Vídeos" }).click();

  const form = page.getByRole("form", { name: "Añadir un vídeo" });
  await form.getByRole("combobox", { name: /Categoría/ }).click();
  await page.getByRole("option", { name: "Deporte" }).click();
  await form.getByRole("combobox", { name: /Idioma/ }).click();
  await page.getByRole("option", { name: "Español" }).click();
  await form.getByLabel(/Enlace de YouTube/).fill(`https://www.youtube.com/watch?v=${youtubeId}`);
  await form.getByLabel(/Título/).fill("Lo que el ejercicio hace por tu cerebro");
  await form.getByRole("button", { name: "Añadir vídeo" }).click();
  // La lista se pagina: se filtra por la categoría, como haría una persona.
  await page.getByRole("combobox", { name: "Filtrar por categoría" }).click();
  await page.getByRole("option", { name: "Deporte" }).click();
  await expect(page.getByRole("table", { name: "Vídeos de inspiración" })).toContainText("Lo que el ejercicio hace por tu cerebro");

  // Editar: cambiarle el idioma (un error al añadirlo) y volver a dejarlo como estaba.
  const row = page.getByRole("row").filter({ hasText: "Lo que el ejercicio hace por tu cerebro" });
  await row.getByRole("button", { name: /Editar/ }).click();
  const editForm = page.getByRole("form", { name: "Editar el vídeo" });
  await expect(editForm).toBeInViewport();
  await expect(editForm.getByLabel(/Título/)).toHaveValue("Lo que el ejercicio hace por tu cerebro");
  await editForm.getByRole("combobox", { name: /Idioma/ }).click();
  await page.getByRole("option", { name: "Inglés" }).click();
  await editForm.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(row).toContainText("Inglés");
  await row.getByRole("button", { name: /Editar/ }).click();
  await editForm.getByRole("combobox", { name: /Idioma/ }).click();
  await page.getByRole("option", { name: "Español" }).click();
  await editForm.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(row).toContainText("Español");

  await page.goto("/categorias/deporte");
  const videos = page.getByRole("region", { name: "Para inspirarte" });
  // En español hay uno: solo ese, sin los de ejemplo en inglés.
  await expect(videos.getByRole("listitem")).toHaveCount(1);
  await expect(videos).toContainText("Lo que el ejercicio hace por tu cerebro");

  await page.goto("/admin");
  await page.getByRole("tab", { name: "Vídeos" }).click();
  await page.getByRole("combobox", { name: "Filtrar por categoría" }).click();
  await page.getByRole("option", { name: "Deporte" }).click();
  await page.getByRole("button", { name: "Borrar «Lo que el ejercicio hace por tu cerebro»" }).click();
  await expect(page.getByRole("table", { name: "Vídeos de inspiración" })).not.toContainText("Lo que el ejercicio hace por tu cerebro");

  // Sin vídeos en español, vuelven los de ejemplo en inglés.
  await page.goto("/categorias/deporte");
  await expect(videos).toContainText("The brain-changing benefits of exercise");
  await expect(videos).not.toContainText("Lo que el ejercicio hace por tu cerebro");
});

test("una cuenta sin rol de administración no puede añadir vídeos (403)", async ({ page }) => {
  await new AccountPages(page).register(newUser());

  const response = await page.request.post("/api/admin/videos", { data: { categoryKey: "deporte", locale: "es", youtubeUrl: "BHY0FxzoKZE", title: "x" } });
  expect(response.status()).toBe(403);
});
