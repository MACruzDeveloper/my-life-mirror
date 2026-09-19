// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AccountPage } from "@modules/cuentas/ui/AccountPage";

function renderConRutas(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route path="/perfil" element={<AccountPage />}>
          <Route index element={<div>Contenido perfil</div>} />
          <Route path="entrevista" element={<div>Contenido entrevista</div>} />
          <Route path="resultados" element={<div>Contenido resultados</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccountPage", () => {
  it("muestra el menú lateral con las tres secciones y el contenido de Perfil por defecto", () => {
    renderConRutas("/perfil");

    for (const nombre of ["Perfil", "Entrevista", "Resultados"]) {
      expect(screen.getAllByRole("link", { name: nombre })[0]).toBeInTheDocument();
    }
    expect(screen.getByText("Contenido perfil")).toBeInTheDocument();
  });

  it("elegir una sección navega a su ruta", async () => {
    renderConRutas("/perfil");

    fireEvent.click(screen.getAllByRole("link", { name: "Entrevista" })[0]);

    await waitFor(() => expect(screen.getByText("Contenido entrevista")).toBeInTheDocument());
  });

  it("al entrar directamente en una ruta, esa sección sale marcada como actual", () => {
    renderConRutas("/perfil/resultados");

    expect(screen.getByText("Contenido resultados")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Resultados" })[0]).toHaveAttribute("aria-current", "page");
  });

  it("ofrece un botón para abrir el menú en móvil", () => {
    renderConRutas("/perfil");

    expect(screen.getByRole("button", { name: "Menú de mi perfil" })).toBeInTheDocument();
  });
});
