// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AccountPage } from "@modules/accounts/ui/AccountPage";

function renderWithRoutes(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/perfil" element={<AccountPage />}>
          <Route index element={<div>Contenido perfil</div>} />
          <Route path="entrevista" element={<div>Contenido entrevista</div>} />
          <Route path="resultados" element={<div>Contenido resultados</div>} />
          <Route path="datos" element={<div>Contenido datos</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccountPage", () => {
  afterEach(() => window.localStorage.clear());

  it("muestra el menú lateral con las cuatro secciones y el contenido de Perfil por defecto", () => {
    renderWithRoutes("/perfil");

    for (const linkName of ["Perfil", "Entrevista", "Resultados", "Privacidad y datos"]) {
      expect(screen.getAllByRole("link", { name: linkName })[0]).toBeInTheDocument();
    }
    expect(screen.getByText("Contenido perfil")).toBeInTheDocument();
  });

  it("elegir una sección navega a su ruta", async () => {
    renderWithRoutes("/perfil");

    fireEvent.click(screen.getAllByRole("link", { name: "Entrevista" })[0]);

    await waitFor(() => expect(screen.getByText("Contenido entrevista")).toBeInTheDocument());
  });

  it("al entrar directamente en una ruta, esa sección sale marcada como actual", () => {
    renderWithRoutes("/perfil/resultados");

    expect(screen.getByText("Contenido resultados")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Resultados" })[0]).toHaveAttribute("aria-current", "page");
  });

  it("ofrece un botón para abrir el menú en móvil", () => {
    renderWithRoutes("/perfil");

    expect(screen.getByRole("button", { name: "Menú de mi perfil" })).toBeInTheDocument();
  });

  describe("menú plegable en escritorio (UX-06)", () => {
    function desktopMenu() {
      return screen.getByRole("navigation", { name: "Menú de mi perfil" });
    }

    it("se puede plegar a solo iconos: cada sección conserva su nombre accesible", () => {
      renderWithRoutes("/perfil");

      const toggle = screen.getByRole("button", { name: "Plegar menú" });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(toggle);

      expect(screen.getByRole("button", { name: "Desplegar menú" })).toHaveAttribute("aria-expanded", "false");
      expect(within(desktopMenu()).getByRole("link", { name: "Entrevista" })).toBeInTheDocument();
      expect(within(desktopMenu()).queryByText("Entrevista")).not.toBeInTheDocument();
    });

    it("recuerda que estaba plegado al volver", () => {
      const first = renderWithRoutes("/perfil");
      fireEvent.click(screen.getByRole("button", { name: "Plegar menú" }));
      first.unmount();

      renderWithRoutes("/perfil");

      expect(screen.getByRole("button", { name: "Desplegar menú" })).toBeInTheDocument();
    });
  });
});
