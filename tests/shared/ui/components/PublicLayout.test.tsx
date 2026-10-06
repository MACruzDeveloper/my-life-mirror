// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import i18n from "@shared/ui/i18n";
import { PublicLayout } from "@shared/ui/components/PublicLayout";
import { Landing } from "@pages/Landing";

function renderPublic() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicLayout (páginas públicas)", () => {
  afterEach(async () => {
    await i18n.changeLanguage("es");
  });

  it("las páginas públicas tienen selector de idioma y pintan su contenido", () => {
    renderPublic();

    expect(screen.getByRole("switch", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("RF-30: al pie, siempre, el enlace a las líneas de ayuda", () => {
    renderPublic();

    expect(screen.getByRole("link", { name: "¿Necesitas ayuda ahora?" })).toHaveAttribute("href", "/ayuda");
  });

  it("se puede pasar la portada a inglés antes de tener cuenta", async () => {
    renderPublic();

    fireEvent.click(screen.getByRole("switch", { name: "English" }));

    expect(await screen.findByRole("link", { name: /create account/i })).toBeInTheDocument();
  });
});
