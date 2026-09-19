// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { ResultsPage } from "@modules/assessments/ui/ResultsPage";

function stub(ok: boolean, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok, json: async () => body })));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ResultsPage", () => {
  it("muestra la puntuación de cada categoría junto a su nombre", async () => {
    stub(true, [
      { categoryId: "c1", categoryName: "Economía", score: 8, recordedAt: "2026-09-19T10:00:00.000Z" },
      { categoryId: "c2", categoryName: "Deporte", score: 2, note: "Poco", recordedAt: "2026-09-19T10:00:00.000Z" },
    ]);
    renderPage();

    await waitFor(() => expect(screen.getByText("Economía")).toBeInTheDocument());
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Bueno", { selector: "[data-band]" })).toHaveAttribute("data-band", "high");
    expect(screen.getByText("Bajo", { selector: "[data-band]" })).toHaveAttribute("data-band", "low");
    expect(screen.getByText("Poco")).toBeInTheDocument();
  });

  it("indica las categorías sin puntuar", async () => {
    stub(true, [{ categoryId: "c1", categoryName: "Economía" }]);
    renderPage();

    await waitFor(() => expect(screen.getByText("Sin puntuar todavía")).toBeInTheDocument());
  });

  it("sin puntuaciones lo dice y ofrece hacer una entrevista", async () => {
    stub(true, []);
    renderPage();

    expect(await screen.findByText("Todavía no hay puntuaciones.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hacer una entrevista" })).toHaveAttribute("href", "/perfil/entrevista");
  });

  it("si la carga falla muestra un error", async () => {
    stub(false, { error: "x" });
    renderPage();

    expect(await screen.findByText("No se pudieron cargar tus resultados")).toBeInTheDocument();
  });
});
