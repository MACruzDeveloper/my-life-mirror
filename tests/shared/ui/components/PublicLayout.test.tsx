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
        {/* Como en la app: la portada ocupa toda la pantalla y pone ella el pie (UX-08). */}
        <Route element={<PublicLayout overlay />}>
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

    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  it("RF-30: al pie, siempre, el enlace a las líneas de ayuda", () => {
    renderPublic();

    expect(screen.getByRole("link", { name: "¿Necesitas ayuda ahora?" })).toHaveAttribute("href", "/ayuda");
  });

  it("en las demás páginas públicas, el pie lo pone la envoltura; a pantalla completa, la propia página (UX-08)", () => {
    const { unmount } = render(
      <MemoryRouter>
        <PublicLayout>
          <p>Un formulario</p>
        </PublicLayout>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "¿Necesitas ayuda ahora?" })).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <PublicLayout overlay>
          <p>Una página a pantalla completa</p>
        </PublicLayout>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "¿Necesitas ayuda ahora?" })).not.toBeInTheDocument();
  });

  it("se puede pasar la portada a inglés antes de tener cuenta", async () => {
    renderPublic();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("link", { name: /create account/i })).toBeInTheDocument();
  });
});
