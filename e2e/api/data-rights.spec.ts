import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { DataPrivacyPage } from "./pages/DataPrivacyPage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

test.describe("RF-05: exportar y eliminar mis datos", () => {
  test("la exportación incluye la cuenta y las puntuaciones guardadas", async ({ page }) => {
    const user = newUser();
    await new AccountPages(page).register(user);
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Economía");
    await interview.score("Economía", 4);
    await interview.save();

    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    const download = await privacy.exportData();
    const exported = await readFile(await download.path(), "utf8");

    expect(exported).toContain(user.email);
    expect(exported).toContain("Economía");
    expect(exported).toMatch(/"score":\s*4/);
  });

  test("eliminar la cuenta (con la contraseña) borra el acceso: no se puede volver a entrar", async ({ page }) => {
    const user = newUser();
    const account = new AccountPages(page);
    await account.register(user);

    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    await privacy.deleteAccount(user.password);
    await expect(page).toHaveURL(/\/$/);

    await account.login(user);
    await expect(page.getByRole("alert")).toContainText(/incorrectos/i);
  });

  test("con una contraseña equivocada no borra nada", async ({ page }) => {
    const user = newUser();
    const account = new AccountPages(page);
    await account.register(user);

    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    await privacy.deleteAccount("no-es-la-clave");
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();

    await page.goto("/inicio");
    await expect(page).toHaveURL(/\/inicio$/);
  });
});
