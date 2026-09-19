// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AdminRoute } from "@modules/admin/ui/AdminRoute";
import { SessionProvider } from "@shared/ui/context/SessionContext";

function renderConSesion(sesion: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => sesion }));
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <SessionProvider>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>Zona admin</div></AdminRoute>} />
          <Route path="/inicio" element={<div>Inicio</div>} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminRoute (ADM-01)", () => {
  it("deja pasar a un admin", async () => {
    renderConSesion({ autenticado: true, email: "a@b.c", rol: "admin" });
    expect(await screen.findByText("Zona admin")).toBeInTheDocument();
  });

  it("redirige a /inicio a un usuario normal", async () => {
    renderConSesion({ autenticado: true, email: "a@b.c", rol: "usuario" });
    expect(await screen.findByText("Inicio")).toBeInTheDocument();
    expect(screen.queryByText("Zona admin")).not.toBeInTheDocument();
  });
});
