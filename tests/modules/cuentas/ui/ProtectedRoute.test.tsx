// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "@modules/cuentas/ui/ProtectedRoute";

function renderConRuta(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route
          path="/inicio"
          element={
            <ProtectedRoute>
              <div>Contenido protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Pantalla de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el contenido si hay sesión", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) }),
    );

    renderConRuta("/inicio");

    await waitFor(() => expect(screen.getByText("Contenido protegido")).toBeInTheDocument());
  });

  it("redirige a /login si no hay sesión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: false }) }));

    renderConRuta("/inicio");

    await waitFor(() => expect(screen.getByText("Pantalla de login")).toBeInTheDocument());
  });
});
