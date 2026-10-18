import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { DataPrivacyPage } from "./pages/DataPrivacyPage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// Dos personas, cada una en su navegador (contexto): quien comparte y quien lee.
// Los tests corren en paralelo sobre la misma base: cada texto lleva un id propio, sin cifras
// (un id como "28984104" es un número largo y el filtro de datos de contacto no lo deja compartir).
function textId() {
  return randomUUID().slice(0, 8).replace(/\d/g, (digit) => "ghijklmnop"[Number(digit)]);
}

test.describe("RF-43: compartir experiencias que funcionan", () => {
  test("con 8 o más se comparte de forma anónima tras pasar los filtros; otra persona la lee en sus ideas y, al reportarla, se retira", async ({ browser }) => {
    const id = textId();
    const sharedText = `Apunto los gastos cada domingo en una libreta (${id})`;

    // Quien comparte: Finanzas con un 9.
    const authorContext = await browser.newContext();
    const authorPage = await authorContext.newPage();
    await new AccountPages(authorPage).register(newUser());
    const author = new InterviewPage(authorPage);
    await author.open();
    await author.activate("Finanzas");
    await author.score("Finanzas", 9);
    await author.save("Finanzas");

    // Un teléfono no pasa los filtros: la ventana dice qué quitar y no se publica.
    await author.addExperience("Finanzas", `Llamadme al 600 123 456 (${id})`);
    await author.experience("Finanzas", "Llamadme").getByRole("button", { name: "Compartir de forma anónima" }).click();
    let dialog = authorPage.getByRole("dialog", { name: "Compartir de forma anónima" });
    await dialog.getByRole("button", { name: "Compartir" }).click();
    await expect(dialog).toContainText(/no puede llevar emails, teléfonos/i);
    await dialog.getByRole("button", { name: "Cancelar" }).click();

    await author.addExperience("Finanzas", sharedText);
    await author.experience("Finanzas", sharedText).getByRole("button", { name: "Compartir de forma anónima" }).click();
    dialog = authorPage.getByRole("dialog", { name: "Compartir de forma anónima" });
    await expect(dialog).toContainText(sharedText);
    await dialog.getByRole("button", { name: "Compartir" }).click();
    await expect(author.experience("Finanzas", sharedText).getByText("Compartida")).toBeVisible();

    // Quien lee: Finanzas con un 2; la idea abre la ventana con la pestaña de otras personas.
    const readerContext = await browser.newContext();
    const readerPage = await readerContext.newPage();
    await new AccountPages(readerPage).register(newUser());
    const reader = new InterviewPage(readerPage);
    await reader.open();
    await reader.activate("Finanzas");
    await reader.score("Finanzas", 2);
    await reader.save("Finanzas");
    const ideas = reader.savedIdeaDialog();
    await ideas.getByRole("tab", { name: /^De otras personas \(\d+\)$/ }).click();
    const sharedItem = ideas.getByRole("listitem").filter({ hasText: sharedText });
    await expect(sharedItem).toBeVisible();
    await expect(ideas).toContainText(/no son consejo profesional/i);
    await expect(ideas).not.toContainText("Llamadme");
    await sharedItem.getByRole("button", { name: "Reportar" }).click();
    await expect(ideas).toContainText("Gracias. La hemos ocultado.");
    await expect(sharedItem).toHaveCount(0);

    // Quien la compartió la ve retirada, y ya no está en Privacidad y datos.
    await authorPage.reload();
    await author.goToQuestions();
    await expect(author.experience("Finanzas", sharedText).getByText("Retirada tras un reporte")).toBeVisible();
    await expect(author.experience("Finanzas", sharedText).getByRole("button", { name: "Compartir de forma anónima" })).toHaveCount(0);
    const privacy = new DataPrivacyPage(authorPage);
    await privacy.open();
    await expect(privacy.sharedExperiences()).toContainText("No tienes ninguna experiencia compartida.");

    await authorContext.close();
    await readerContext.close();
  });

  test("'Dejar de compartir' desde Privacidad y datos la vuelve privada", async ({ page }) => {
    const text = `Una hucha para los imprevistos (${textId()})`;
    await new AccountPages(page).register(newUser());
    const interview = new InterviewPage(page);
    await interview.open();
    await interview.activate("Familia");
    await interview.score("Familia", 8);
    await interview.save("Familia");
    await interview.addExperience("Familia", text);
    await interview.experience("Familia", text).getByRole("button", { name: "Compartir de forma anónima" }).click();
    await page.getByRole("dialog", { name: "Compartir de forma anónima" }).getByRole("button", { name: "Compartir" }).click();
    await expect(interview.experience("Familia", text).getByText("Compartida")).toBeVisible();

    const privacy = new DataPrivacyPage(page);
    await privacy.open();
    const item = privacy.sharedExperiences().getByRole("listitem").filter({ hasText: text });
    await expect(item).toContainText("Familia");
    const saved = page.waitForResponse((response) => response.url().endsWith("/api/categories/diary") && response.request().method() === "PATCH" && response.ok());
    await item.getByRole("button", { name: "Dejar de compartir" }).click();
    await saved;
    await expect(privacy.sharedExperiences()).toContainText("No tienes ninguna experiencia compartida.");

    await interview.open();
    await interview.goToQuestions();
    await expect(interview.experience("Familia", text).getByRole("button", { name: "Compartir de forma anónima" })).toBeVisible();
  });
});
