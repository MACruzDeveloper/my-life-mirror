// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { withClient } from "../../../helpers/queryClient";
import { ResultsPage } from "@modules/assessments/ui/ResultsPage";
import { categoryLabelsFixture } from "../../../helpers/categoryLabels";
import { CHART_ACCENT } from "@shared/ui/theme";

// UX-13: el gráfico de barras es de ECharts; aquí se comprueba la opción que recibe.
const setOption = vi.fn();
vi.mock("echarts/core", () => ({ use: vi.fn(), init: vi.fn(() => ({ setOption, resize: vi.fn(), dispose: vi.fn() })) }));
const lastOption = () => setOption.mock.calls.at(-1)![0];

function stub(ok: boolean, body: unknown, recommendations: unknown = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url === "/api/recommendations"
        ? Promise.resolve({ ok: true, json: async () => recommendations })
        : url === "/api/assessments/history"
          ? Promise.resolve({ ok: true, json: async () => HISTORY })
          : url === "/api/categories/diary"
            ? Promise.resolve({ ok: true, json: async () => [] })
        : url === "/api/categories/translations"
          ? Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() })
          : Promise.resolve({ ok, json: async () => body }),
    ),
  );
}

const HISTORY = [{ recordedAt: "2026-09-19T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 8, previousScore: 5 }] }];

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

/** La idea de una categoría, en la lista de debajo del gráfico (UX-13). */
const ideaItem = (name: string) => screen.queryAllByRole("listitem").find((item) => item.textContent?.startsWith(name));

describe("ResultsPage", () => {
  it("muestra la puntuación de cada categoría junto a su nombre", async () => {
    stub(true, [
      { categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 8, recordedAt: "2026-09-19T10:00:00.000Z" },
      { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", score: 2, note: "Poco", recordedAt: "2026-09-19T10:00:00.000Z" },
    ]);
    renderPage();

    // UX-13: un gráfico de barras, una por categoría puntuada, todas del color de los gráficos.
    const chart = await screen.findByRole("img", { name: /Finanzas: 8 \(Bueno\).*Deporte: 2 \(Bajo\)/ });
    expect(chart).toBeInTheDocument();
    expect(lastOption().yAxis.data).toEqual(["Finanzas", "Deporte"]);
    expect(lastOption().series[0].data).toEqual([8, 2]);
    expect(lastOption().series[0].itemStyle.color).toBe(CHART_ACCENT);
    // El tooltip dice la banda y la fecha.
    expect(lastOption().tooltip.formatter({ dataIndex: 1 })).toMatch(/Deporte.*2.*Bajo.*19\/9\/2026/s);
    // La tabla de datos, también con la banda.
    fireEvent.click(screen.getByRole("button", { name: "Ver datos" }));
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent(/Finanzas[\s\S]*8[\s\S]*Bueno/);
    // RF-44: la nota antigua de la evaluación ya no se enseña (está en el diario de experiencias).
    expect(screen.queryByText("Poco")).not.toBeInTheDocument();
  });

  it("indica las categorías sin puntuar", async () => {
    stub(true, [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas" }]);
    renderPage();

    expect(await screen.findByText(/Sin puntuar todavía: Finanzas/)).toBeInTheDocument();
    // Sin ninguna puntuada, no hay gráfico.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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

  it("muestra la recomendación bajo el gráfico, junto al nombre de su categoría, con el aviso de que no es asesoramiento profesional", async () => {
    stub(
      true,
      [
        { categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 8, recordedAt: "2026-09-19T10:00:00.000Z" },
        { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" },
      ],
      [{ id: "r1", categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", templateKey: "deporte.1", status: "pending" }],
    );
    renderPage();

    await waitFor(() => expect(ideaItem("Deporte")).toBeDefined());
    const ideaButton = within(ideaItem("Deporte")!).getByRole("button", { name: /una idea para ti/i });
    expect(ideaItem("Finanzas")).toBeUndefined();
    fireEvent.click(ideaButton);
    const dialog = screen.getByRole("dialog");
    // RF-42: el carrusel espera a tener las categorías (para quitar las ideas que chocan).
    expect(await within(dialog).findByText(/sal a caminar/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
  });

  it("sin recomendaciones no muestra el aviso; y si la carga de recomendaciones falla, la pantalla sigue funcionando", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/api/categories/translations"
          ? Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() })
          : url === "/api/recommendations"
          ? Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
          : Promise.resolve({ ok: true, json: async () => [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" }] }),
      ),
    );
    renderPage();

    expect(await screen.findByRole("img", { name: /Finanzas/ })).toBeInTheDocument();
    expect(screen.queryByText(/no sustituyen el asesoramiento/i)).not.toBeInTheDocument();
  });

  it("con puntuaciones guardadas ofrece actualizar las respuestas, no hacer otra entrevista", async () => {
    stub(true, [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 6, recordedAt: "2026-09-19T10:00:00.000Z" }]);
    renderPage();

    expect(await screen.findByRole("link", { name: /actualizar mis respuestas/i })).toHaveAttribute("href", "/perfil/entrevista");
    expect(screen.queryByRole("link", { name: /hacer una entrevista/i })).not.toBeInTheDocument();
  });

  it("en inglés, el gráfico usa el nombre traducido", async () => {
    const i18n = (await import("@shared/ui/i18n")).default;
    await i18n.changeLanguage("en");
    try {
      stub(true, [{ categoryId: "c1", catalogId: "k-vidaSocial", categoryName: "Vida social", score: 6, recordedAt: "2026-09-19T10:00:00.000Z" }]);
      renderPage();

      expect(await screen.findByRole("img", { name: /Social life: 6/ })).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("es");
    }
  });

  it("incluye el historial de cambios, plegado; al abrirlo se ven los cambios por día (UX-05)", async () => {
    stub(true, [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Finanzas", score: 8, recordedAt: "2026-09-19T10:00:00.000Z" }]);
    renderPage();

    const history = await screen.findByRole("region", { name: /historial de cambios/i });
    fireEvent.click(await within(history).findByRole("button", { name: /ver mi historial \(1\)/i }));
    expect(within(history).getByText(/Finanzas: 5 → 8/)).toBeInTheDocument();
  });
});
