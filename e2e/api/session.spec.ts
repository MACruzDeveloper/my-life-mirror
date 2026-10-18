import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { newUser } from "./pages/users";

// SEC-05: la sesión se renueva sola con la cookie de renovación; si no se puede, la app lo dice.
test.describe("SEC-05: sesión renovada", () => {
  test("sin la cookie de acceso (pasó la hora), guardar el perfil sigue funcionando y llega una nueva", async ({ page, context }) => {
    await new AccountPages(page).register(newUser());
    await page.goto("/perfil");
    const name = page.getByRole("textbox", { name: /Nombre/ });
    await expect(name).not.toHaveValue("");

    await context.clearCookies({ name: "sesion" });
    await name.fill("Ana renovada");
    const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/accounts/profile" && response.request().method() !== "GET");
    await page.getByRole("button", { name: "Guardar" }).click();

    const response = await saved;
    expect(response.status()).toBe(200);
    expect(await response.headerValue("set-cookie")).toMatch(/sesion=.+sesion_renovar=/s);
    expect((await context.cookies()).some((cookie) => cookie.name === "sesion" && cookie.value !== "")).toBe(true);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("sin ninguna de las dos cookies, al guardar avisa de que la sesión ha caducado y lleva a entrar", async ({ page, context }) => {
    await new AccountPages(page).register(newUser());
    await page.goto("/perfil");
    await expect(page.getByRole("textbox", { name: /Nombre/ })).not.toHaveValue("");

    await context.clearCookies();
    await page.getByRole("button", { name: "Guardar" }).click();

    const dialog = page.getByRole("dialog", { name: "Tu sesión ha caducado" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Volver a entrar" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
