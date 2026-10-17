import { expect, test } from "@playwright/test";

/**
 * Primer test E2E del proyecto (V&V apartado 1). Deliberadamente limitado a lo que
 * no toca `api/` — un registro/login real de verdad crearía una cuenta real
 * en Supabase Auth en cada ejecución. Cubrir el flujo completo (RF-01) con
 * Playwright es la lección de apartado 1.1, pero necesita antes una decisión sobre
 * cómo aislar los datos de prueba (proyecto de Supabase dedicado, o
 * limpieza tras cada test) — no asumida aquí, ver AGENTS.md/pregunta al usuario.
 */
test.describe("Landing pública", () => {
  test("muestra la introducción y enlaza a registro e inicio de sesión", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "MyLifeMirror" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  test("el enlace de registro navega al formulario con los campos esperados", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Crear cuenta" }).click();

    await expect(page).toHaveURL("/registro");
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel(/^contraseña/i)).toBeVisible();
  });

  test("la política de privacidad es alcanzable y muestra la versión vigente", async ({ page }) => {
    await page.goto("/politica-privacidad");

    await expect(page.getByRole("heading", { name: "Política de privacidad" })).toBeVisible();
    await expect(page.getByText(/versión 2026-09/i)).toBeVisible();
  });
});

test.describe("UX-08: portada con imagen", () => {
  for (const [name, viewport, size, otherSize] of [
    ["móvil", { width: 390, height: 844 }, "828", "1672"],
    ["escritorio", { width: 1280, height: 800 }, "1672", "828"],
  ] as const) {
    test(`en ${name}, la primera vista es la imagen a pantalla completa; al bajar aparecen la segunda imagen y "Cómo funciona"`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const images: string[] = [];
      // Solo las descargas de imagen: en desarrollo, Vite sirve además cada import como un módulo.
      page.on("response", (response) => /portada-[ab]-/.test(response.url()) && (response.headers()["content-type"] ?? "").startsWith("image/") && images.push(response.url()));
      await page.goto("/");

      // Primera vista: la imagen ocupa exactamente la pantalla, desde arriba del todo.
      const hero = page.getByRole("region", { name: "MyLifeMirror" });
      const box = (await hero.boundingBox())!;
      expect(box.y).toBe(0);
      expect(box.width).toBe(viewport.width);
      expect(box.height).toBe(viewport.height);
      await expect(hero.getByRole("heading", { level: 1 })).toBeInViewport();
      await expect(hero.getByText(/Crea tu cuenta/)).toBeInViewport();
      await expect(page.getByRole("button", { name: "English" })).toBeInViewport();
      const howItWorks = page.getByRole("heading", { name: "Cómo funciona" });
      await expect(howItWorks).not.toBeInViewport();

      // La flecha lleva a la segunda parte, que sube sobre su propia imagen de fondo.
      await hero.getByRole("link", { name: "Ver cómo funciona" }).click();
      await expect(howItWorks).toBeInViewport();
      // Los botones de entrar, ahí, junto a cómo funciona.
      await expect(page.getByRole("link", { name: "Crear cuenta" })).toBeInViewport();
      // El idioma y el aviso de IA se quedan fijos al bajar: siguen a la vista sobre la segunda imagen, y el aviso no está repetido.
      await expect(page.getByRole("button", { name: "English" })).toBeInViewport();
      await expect(page.getByText("Imagen generada con IA")).toHaveCount(1);
      await expect(page.getByText("Imagen generada con IA")).toBeInViewport();

      // Las dos imágenes, cada una en el tamaño de esta pantalla y no en el otro.
      await expect.poll(() => images.length).toBe(2);
      for (const url of images) {
        expect(url).toContain(`-${size}`);
        expect(url).not.toContain(`-${otherSize}`);
      }
      // Nada se sale de la pantalla a lo ancho.
      expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true);
    });
  }
});

test.describe("Idioma en las páginas públicas (RNF-10)", () => {
  test("se puede pasar la portada a inglés antes de tener cuenta, y la elección se recuerda", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await page.getByRole("button", { name: "English" }).click();

    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });
});

test.describe("Líneas de ayuda (RF-30)", () => {
  test("desde el pie de la portada, sin cuenta, se llega a las líneas de ayuda con sus números para llamar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("contentinfo").getByRole("link", { name: "¿Necesitas ayuda ahora?" }).click();

    await expect(page).toHaveURL(/\/ayuda$/);
    await expect(page.getByRole("heading", { level: 1, name: "¿Necesitas ayuda ahora?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Llamar al 024" })).toHaveAttribute("href", "tel:024");
    await expect(page.getByRole("link", { name: "Llamar al 112" })).toHaveAttribute("href", "tel:112");
    await expect(page.getByRole("link", { name: "Find A Helpline" })).toHaveAttribute("href", "https://findahelpline.com");
  });
});

test.describe("Capas CSS: el CSS propio gana a Material UI sin !important", () => {
  test("una regla sin capa se impone a la de MUI aunque tenga menos especificidad", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("link", { name: "Crear cuenta" });
    await expect(button).toHaveClass(/MuiButton-root/);
    await expect(button).not.toHaveCSS("text-transform", "lowercase");

    // Como si estuviera en skin.css: sin capa, sin !important y con especificidad cero (`:where`), menor
    // que la de MUI (una clase). Sin capas perdería siempre; con ellas gana por estar fuera de la capa `mui`.
    await page.addStyleTag({ content: ":where(.MuiButton-root) { text-transform: lowercase; }" });

    await expect(button).toHaveCSS("text-transform", "lowercase");
  });

  // Fallo real en producción (11 oct.): un `* { box-sizing: border-box }` propio, sin capa, ganaba al
  // `content-box` que MUI necesita en sus campos; quedaban en 33 px de alto y la etiqueta, descolocada.
  test("el CSS propio no deforma los campos de texto de MUI: altura completa y etiqueta centrada", async ({ page }) => {
    await page.goto("/olvide-password");
    const field = page.locator(".MuiInputBase-root").filter({ has: page.getByLabel(/email/i) });

    const box = await field.boundingBox();
    const label = await page.locator("label", { hasText: /email/i }).boundingBox();

    expect(box?.height).toBe(56);
    // La etiqueta, sin escribir nada, queda dentro del campo y centrada en vertical.
    const labelCentre = label!.y + label!.height / 2;
    expect(Math.abs(labelCentre - (box!.y + box!.height / 2))).toBeLessThan(3);
  });

  test("las pantallas públicas de cuenta dan sitio al rastro de navegación en una sola línea (escritorio)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto("/olvide-password");

    const breadcrumbs = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(breadcrumbs).toContainText("Recuperar contraseña");
    // Una línea de texto: menos de dos alturas de línea.
    expect((await breadcrumbs.locator("ol").boundingBox())!.height).toBeLessThan(40);
  });
});

