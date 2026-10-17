import { expect, test } from "@playwright/test";
import { AccountPages } from "./pages/AccountPages";
import { HomePage } from "./pages/HomePage";
import { InterviewPage } from "./pages/InterviewPage";
import { newUser } from "./pages/users";

// UX-12: "Guardar todo" en la barra fija de la entrevista: varias categorías de una vez.
test("dos notas cambiadas se guardan de una vez, siguen tras recargar, y la barra queda a la vista al bajar", async ({ page }) => {
  await new AccountPages(page).register(newUser());
  await new HomePage(page).startInterviewLink().click();
  const interview = new InterviewPage(page);
  for (const name of ["Economía", "Familia", "Aventura"]) await interview.activate(name);

  await interview.goToQuestions();
  const saveAll = page.getByRole("button", { name: /^Guardar todo/ });
  await expect(saveAll).toBeDisabled();
  await interview.score("Economía", 7);
  await interview.score("Familia", 6);
  await expect(saveAll).toHaveAccessibleName("Guardar todo (2)");

  // Al bajar hasta la última pregunta, el botón sigue a la vista.
  await interview.question("Economía").scrollIntoViewIfNeeded();
  await expect(saveAll).toBeInViewport();

  const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/assessments" && response.request().method() === "POST");
  await saveAll.click();
  expect(JSON.parse((await saved).request().postData() ?? "{}").entries).toHaveLength(2);
  await expect(saveAll).toBeDisabled();

  await page.reload();
  await expect(interview.question("Economía")).toContainText("· 7");
  await expect(interview.question("Familia")).toContainText("· 6");
});
