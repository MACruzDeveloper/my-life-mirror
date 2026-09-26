// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { withClient } from "../../../helpers/queryClient";
import { ResultsPage } from "@modules/assessments/ui/ResultsPage";

function stub(ok: boolean, body: unknown, recommendations: unknown = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url === "/api/recommendations" ? Promise.resolve({ ok: true, json: async () => recommendations }) : Promise.resolve({ ok, json: async () => body }),
    ),
  );
}

function renderPage() {
  return render(
    withClient(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>,
    ),
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

  it("muestra la recomendación dentro de la tarjeta de su categoría, con el aviso de que no es asesoramiento profesional", async () => {
    stub(
      true,
      [
        { categoryId: "c1", categoryName: "Economía", score: 8, recordedAt: "2026-09-19T10:00:00.000Z" },
        { categoryId: "c2", categoryName: "Deporte", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" },
      ],
      [{ id: "r1", categoryId: "c2", categoryName: "Deporte", templateKey: "deporte.1", status: "pending" }],
    );
    renderPage();

    const sportCard = (await screen.findByText("Deporte")).closest("div[class]")!.parentElement!;
    const ideaButton = await within(sportCard).findByRole("button", { name: /una idea para ti/i });
    const economyCard = screen.getByText("Economía").closest("div[class]")!.parentElement!;
    expect(within(economyCard).queryByRole("button", { name: /una idea para ti/i })).not.toBeInTheDocument();
    fireEvent.click(ideaButton);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/sal a caminar/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
  });

  it("sin recomendaciones no muestra el aviso; y si la carga de recomendaciones falla, la pantalla sigue funcionando", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/api/recommendations"
          ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
          : Promise.resolve({ ok: true, json: async () => [{ categoryId: "c1", categoryName: "Economía", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" }] }),
      ),
    );
    renderPage();

    expect(await screen.findByText("Economía")).toBeInTheDocument();
    expect(screen.queryByText(/no sustituyen el asesoramiento/i)).not.toBeInTheDocument();
  });

  it("con puntuaciones guardadas ofrece actualizar las respuestas, no hacer otra entrevista", async () => {
    stub(true, [{ categoryId: "c1", categoryName: "Economía", score: 6, recordedAt: "2026-09-19T10:00:00.000Z" }]);
    renderPage();

    expect(await screen.findByRole("link", { name: /actualizar mis respuestas/i })).toHaveAttribute("href", "/perfil/entrevista");
    expect(screen.queryByRole("link", { name: /hacer una entrevista/i })).not.toBeInTheDocument();
  });
});

