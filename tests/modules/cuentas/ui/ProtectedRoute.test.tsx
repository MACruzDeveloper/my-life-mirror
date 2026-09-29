// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "@modules/cuentas/ui/ProtectedRoute";

afterEach(() => vi.unstubAllGlobals());

describe("ProtectedRoute como ruta de diseño", () => {
  it("consulta la sesión una sola vez al navegar entre pantallas protegidas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "a@b.c" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<Link to="/perfil">ir a perfil</Link>} />
            <Route path="/perfil" element={<div>Perfil</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByText("ir a perfil"));

    expect(await screen.findByText("Perfil")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin sesión redirige a /login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: false }) }));

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<div>Inicio</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login")).toBeInTheDocument();
  });
});
