// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { withClient } from "../../../helpers/queryClient";
import { Home } from "@modules/panel/ui/Home";

function stub(body: unknown, ok = true, recomendaciones: unknown = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url === "/api/recommendations" ? Promise.resolve({ ok: true, json: async () => recomendaciones }) : Promise.resolve({ ok, json: async () => body }),
    ),
  );
}

function renderHome() {
  return render(
    withClient(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    ),
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

  it("el panel del usuario recurrente enseña la recomendación de una categoría baja", async () => {
    stub(
      [{ categoryId: "c1", categoryName: "Economía", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" }],
      true,
      [{ id: "r1", categoryId: "c1", categoryName: "Economía", templateKey: "economia.1", status: "pending" }],
    );
    renderHome();

    const tarjeta = (await screen.findByText("Economía")).closest("div[class]")!.parentElement!;
    expect(await within(tarjeta).findByText(/una idea para ti/i)).toBeInTheDocument();
    expect(screen.getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
  });
});
