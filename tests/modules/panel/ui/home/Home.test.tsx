// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { withClient } from "../../../../helpers/queryClient";
import { Home } from "@modules/panel/ui/home/Home";
import { categoryLabelsFixture } from "../../../../helpers/categoryLabels";

vi.mock("echarts/core", () => ({ use: vi.fn(), init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() })) }));

function stub(body: unknown, ok = true, recommendations: unknown = [], history: unknown = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/recommendations") return Promise.resolve({ ok: true, json: async () => recommendations });
      if (url === "/api/assessments/history") return Promise.resolve({ ok: true, json: async () => history });
      if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() });
      return Promise.resolve({ ok, json: async () => body });
    }),
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

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

// Header/sesión/cerrar-sesión los cubre ProtectedLayout; Home solo decide
// entre la bienvenida de primera vez y el panel (RF-14, por ahora los resultados).
describe("Home (RF-39 / RF-14)", () => {
  it("un usuario sin ninguna puntuación ve la bienvenida con un enlace grande a la entrevista", async () => {
    stub([{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía" }]);
    renderHome();

    const link = await screen.findByRole("link", { name: /empezar mi entrevista/i });
    expect(link).toHaveAttribute("href", "/perfil/entrevista");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    // UX-01: justo después de registrarse, los mismos pasos que en la portada.
    expect(screen.getByRole("region", { name: /cómo funciona/i })).toBeInTheDocument();
  });

  it("un usuario que aún no tiene ninguna categoría también ve la bienvenida", async () => {
    stub([]);
    renderHome();

    expect(await screen.findByRole("link", { name: /empezar mi entrevista/i })).toBeInTheDocument();
  });

  it("un usuario con puntuaciones va directo al panel con sus resultados", async () => {
    stub([{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-19T10:00:00.000Z" }]);
    renderHome();

    expect(await screen.findByText("Economía")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /empezar mi entrevista/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /actualizar mis respuestas/i })).toHaveAttribute("href", "/perfil/entrevista");
    expect(screen.queryByText(/nueva entrevista/i)).not.toBeInTheDocument();
  });

  it("el panel del usuario recurrente enseña la recomendación de una categoría baja", async () => {
    stub(
      [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" }],
      true,
      [{ id: "r1", categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", templateKey: "economia.1", status: "pending" }],
    );
    renderHome();

    const card = await screen.findByRole("region", { name: "Economía" });
    const ideaButton = await within(card).findByRole("button", { name: /una idea para ti/i });
    expect(screen.queryByText(/en qué se va tu dinero/i)).not.toBeInTheDocument();
    fireEvent.click(ideaButton);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
  });

  it("un fallo al cargar las puntuaciones no se confunde con la bienvenida de primera vez, y se puede reintentar", async () => {
    let shouldFail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/recommendations" || url === "/api/assessments/history") return Promise.resolve({ ok: true, json: async () => [] });
        if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() });
        if (shouldFail) {
          shouldFail = false;
          return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-19T10:00:00.000Z" }],
        });
      }),
    );
    renderHome();

    expect(await screen.findByText(/no se pudieron cargar tus resultados/i)).toBeInTheDocument();
    expect(screen.queryByText(/empecemos por conocerte/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /empezar mi entrevista/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByText("Economía")).toBeInTheDocument();
  });

  it("el panel muestra la evolución de cada categoría activa con su puntuación actual (RF-16), no las tarjetas de Resultados", async () => {
    stub(
      [
        { categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-18T10:00:00.000Z" },
        { categoryId: "c2", catalogId: "k-familia", categoryName: "Familia" },
      ],
      true,
      [],
      [
        { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, previousScore: 3 }] },
        { recordedAt: "2026-01-15T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 3 }, { categoryId: "c9", catalogId: "k-pareja", categoryName: "Pareja", score: 8 }] },
      ],
    );
    renderHome();

    expect(await screen.findByRole("heading", { name: /tu evolución/i })).toBeInTheDocument();
    const economyCard = await screen.findByRole("region", { name: "Economía" });
    expect(within(economyCard).getByText("7")).toBeInTheDocument();
    expect(await within(economyCard).findByRole("img", { name: /evolución de economía[\s\S]*3[\s\S]*7/i })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Familia" })).getByText(/sin puntuar todavía/i)).toBeInTheDocument();
    // Pareja no está activa: no aparece aunque tenga historial.
    expect(screen.queryByRole("region", { name: "Pareja" })).not.toBeInTheDocument();
    // Las tarjetas de detalle (fecha de la última vez) se quedan en Resultados.
    expect(screen.queryByText(/última vez/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver el detalle en resultados/i })).toHaveAttribute("href", "/perfil/resultados");
  });

  it("el panel empieza por el equilibrio (RF-15) y sigue con la evolución (RF-16)", async () => {
    stub(
      [
        { categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-18T10:00:00.000Z" },
        { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", score: 3, recordedAt: "2026-09-18T10:00:00.000Z" },
        { categoryId: "c3", catalogId: "k-aventura", categoryName: "Aventura", score: 9, recordedAt: "2026-09-18T10:00:00.000Z" },
      ],
    );
    renderHome();

    const balance = await screen.findByRole("heading", { name: /tu equilibrio/i });
    const evolution = screen.getByRole("heading", { name: /tu evolución/i });
    expect(balance.compareDocumentPosition(evolution) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("en inglés, el panel nombra cada categoría por su id: tarjetas, radar y la idea de mejora (RNF-10)", async () => {
    const i18n = (await import("@shared/ui/i18n")).default;
    await i18n.changeLanguage("en");
    try {
      stub(
        [
          { catalogId: "k-economia", categoryName: "Economía", categoryId: "c1", score: 2, recordedAt: "2026-09-18T10:00:00.000Z" },
          { catalogId: "k-deporte", categoryName: "Deporte", categoryId: "c2", score: 7, recordedAt: "2026-09-18T10:00:00.000Z" },
          { catalogId: "k-familia", categoryName: "Familia", categoryId: "c3", score: 8, recordedAt: "2026-09-18T10:00:00.000Z" },
        ],
        true,
        [{ id: "r1", categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", templateKey: "economia.1", status: "pending" }],
      );
      renderHome();

      const card = await screen.findByRole("region", { name: "Finances" });
      expect(screen.getByRole("img", { name: /finances 2[\s\S]*sport 7[\s\S]*family 8/i })).toBeInTheDocument();
      fireEvent.click(within(card).getByRole("button", { name: /an idea for you/i }));
      expect(screen.getByRole("dialog", { name: "An idea for Finances" })).toBeInTheDocument();
      expect(screen.queryByText("Economía")).not.toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("es");
    }
  });

  describe("resumen de ideas (UX-02)", () => {
    const SCORES = [
      { categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 2, recordedAt: "2026-09-19T10:00:00.000Z" },
      { categoryId: "c2", catalogId: "k-familia", categoryName: "Familia", score: 9, recordedAt: "2026-09-19T10:00:00.000Z" },
    ];

    it("con recomendaciones abiertas, las resume arriba con un botón por categoría que abre la idea", async () => {
      stub(SCORES, true, [{ id: "r1", categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", templateKey: "economia.1", status: "pending" }]);
      renderHome();

      const summary = await screen.findByRole("region", { name: /ideas para ti/i });
      const button = await within(summary).findByRole("button", { name: /idea para economía/i });
      expect(within(summary).queryByRole("button", { name: /familia/i })).not.toBeInTheDocument();
      fireEvent.click(button);
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
    });

    it("sin recomendaciones no aparece", async () => {
      stub(SCORES);
      renderHome();

      await screen.findByRole("region", { name: "Economía" });
      expect(screen.queryByRole("region", { name: /ideas para ti/i })).not.toBeInTheDocument();
    });
  });

  describe("guía del panel (UX-01)", () => {
    const SCORED = [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-19T10:00:00.000Z" }];

    it("explica cada parte del panel, nombrando los botones con su texto real", async () => {
      stub(SCORED);
      renderHome();

      const guide = await screen.findByRole("region", { name: /cómo leer esta página/i });
      expect(guide).toHaveTextContent(/tu equilibrio/i);
      expect(guide).toHaveTextContent(/tu evolución/i);
      expect(guide).toHaveTextContent(/una idea para ti/i);
      expect(guide).toHaveTextContent(/actualizar mis respuestas/i);
    });

    it("'Entendido' la cierra, no vuelve al volver a Inicio y se puede abrir otra vez", async () => {
      stub(SCORED);
      const firstVisit = renderHome();
      fireEvent.click(await screen.findByRole("button", { name: /entendido/i }));
      expect(screen.queryByRole("region", { name: /cómo leer esta página/i })).not.toBeInTheDocument();
      firstVisit.unmount();

      renderHome();
      await screen.findByText("Economía");
      expect(screen.queryByRole("region", { name: /cómo leer esta página/i })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /cómo leer esta página/i }));
      expect(screen.getByRole("region", { name: /cómo leer esta página/i })).toBeInTheDocument();
    });

    it("sin localStorage (modo privado estricto) se cierra igualmente, sin errores", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      stub(SCORED);
      renderHome();

      fireEvent.click(await screen.findByRole("button", { name: /entendido/i }));
      expect(screen.queryByRole("region", { name: /cómo leer esta página/i })).not.toBeInTheDocument();
      vi.restoreAllMocks();
    });
  });
});
