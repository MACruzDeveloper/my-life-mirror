import { expect, test } from "@playwright/test";
import { newUser } from "./pages/users";

// Fallo real (13 oct.): varias pantallas piden las categorías a la vez y, para una cuenta recién creada,
// todas intentan crearle sus categorías. Una de las peticiones acababa en error 500.
test("varias peticiones simultáneas de categorías de una cuenta nueva responden todas bien, sin duplicar nada", async ({ page }) => {
  const user = newUser();
  const registered = await page.request.post("/api/accounts/register", { data: { name: user.name, email: user.email, password: user.password } });
  expect(registered.ok()).toBe(true);

  const responses = await Promise.all(Array.from({ length: 12 }, () => page.request.get("/api/categories")));

  expect(responses.map((response) => response.status())).toEqual(Array(12).fill(200));
  const lists = (await Promise.all(responses.map((response) => response.json()))) as { name: string }[][];
  const names = lists[0].map((category) => category.name).sort();
  expect(new Set(names).size).toBe(names.length);
  for (const list of lists) expect(list.map((category) => category.name).sort()).toEqual(names);
});
