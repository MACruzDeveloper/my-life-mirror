import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// RF-50: con todo en verde, Inicio deja de proponer mejoras y ofrece ideas para disfrutar.
test("con tres categorías en verde, Inicio enseña 'Todo va bien' y se puede pasar a otra idea; con una baja, desaparece", async ({ page }) => {
  await new AccountPages(page).register(newUser());
  await new HomePage(page).startInterviewLink().click();
  const interview = new InterviewPage(page);
  for (const name of ["Economía", "Familia", "Aventura"]) await interview.activate(name);
  for (const name of ["Economía", "Familia"]) {
    await interview.score(name, 9);
    await interview.save(name);
  }
  // Al quedar la tercera en verde, la entrevista lo dice y enlaza a Inicio.
  await interview.score("Aventura", 9);
  await interview.save("Aventura");
  const toast = page.getByRole("status").filter({ hasText: "Todo en verde" });
  await expect(toast).toBeVisible();
  await expect(toast.getByRole("link", { name: "Ver ideas en Inicio" })).toHaveAttribute("href", "/inicio");

  const home = new HomePage(page);
  await home.open();
  const card = page.getByRole("region", { name: "Todo va bien" });
  await expect(card).toContainText("No hace falta mejorar nada");
  await expect(card).toContainText("Idea 1 de 8");
  await card.getByRole("button", { name: "Otra idea" }).click();
  await expect(card).toContainText("Idea 2 de 8");

  await interview.open();
  await interview.score("Familia", 5);
  await interview.save("Familia");
  await home.open();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(card).toHaveCount(0);
});
