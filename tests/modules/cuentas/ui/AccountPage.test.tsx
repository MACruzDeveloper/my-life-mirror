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
          <Route path="categorias" element={<div>Contenido categorías</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccountPage", () => {
  it("muestra las pestañas Perfil y Categorías, con Perfil activa por defecto", () => {
    renderConRutas("/perfil");

    expect(screen.getByRole("tab", { name: "Perfil", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Contenido perfil")).toBeInTheDocument();
  });

  it("cambiar de pestaña navega a /perfil/categorias", async () => {
    renderConRutas("/perfil");

    fireEvent.click(screen.getByRole("tab", { name: "Categorías" }));

    await waitFor(() => expect(screen.getByText("Contenido categorías")).toBeInTheDocument());
  });

  it("al entrar directamente en /perfil/categorias, esa pestaña ya sale activa", () => {
    renderConRutas("/perfil/categorias");

    expect(screen.getByRole("tab", { name: "Categorías", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Contenido categorías")).toBeInTheDocument();
  });
});
