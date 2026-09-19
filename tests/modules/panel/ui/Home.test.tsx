// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { Home } from "@modules/panel/ui/Home";

function stub(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok, json: async () => body })));
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

// Header/sesión/cerrar-sesión los cubre ProtectedLayout; Home solo decide
// entre la bienvenida de primera vez y el panel (RF-14, por ahora los resultados).
describe("Home (RF-39 / RF-14)", () => {
  it("un usuario sin ninguna puntuación ve la bienvenida con un enlace grande a la entrevista", async () => {
    stub([{ categoryId: "c1", categoryName: "Economía" }]);
    renderHome();

    const enlace = await screen.findByRole("link", { name: /empezar mi entrevista/i });
    expect(enlace).toHaveAttribute("href", "/perfil/entrevista");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("un usuario que aún no tiene ninguna categoría también ve la bienvenida", async () => {
    stub([]);
    renderHome();

    expect(await screen.findByRole("link", { name: /empezar mi entrevista/i })).toBeInTheDocument();
  });

  it("un usuario con puntuaciones va directo al panel con sus resultados", async () => {
    stub([{ categoryId: "c1", categoryName: "Economía", score: 7, recordedAt: "2026-09-19T10:00:00.000Z" }]);
    renderHome();

    expect(await screen.findByText("Economía")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /empezar mi entrevista/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nueva entrevista/i })).toHaveAttribute("href", "/perfil/entrevista");
  });
});
