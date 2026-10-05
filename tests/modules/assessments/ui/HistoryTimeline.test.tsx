// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { HistoryTimeline } from "@modules/assessments/ui/HistoryTimeline";
import { withClient } from "../../../helpers/queryClient";
import { categoryLabelsFixture } from "../../../helpers/categoryLabels";

const session = (recordedAt: string, score: number, previousScore?: number) => ({
  recordedAt,
  entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score, ...(previousScore !== undefined ? { previousScore } : {}) }],
});

function stubHistory(sessions: unknown[], experiences: unknown[] = []) {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve({ ok: true, json: async () => (url === "/api/categories/translations" ? categoryLabelsFixture() : url === "/api/categories/diary" ? experiences : sessions) }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await i18n.changeLanguage("es");
});

describe("HistoryTimeline (UX-04, en Resultados desde UX-05)", () => {
  it("empieza plegado: solo el botón con el número de guardados", async () => {
    stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6), session("2026-01-15T10:00:00.000Z", 6)]);
    render(withClient(<HistoryTimeline />));

    expect(await screen.findByRole("button", { name: "Ver mi historial (2)" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Economía: 6 → 4/)).not.toBeInTheDocument();
  });

  it("al abrirlo agrupa por meses, del más reciente al más antiguo, y se puede volver a ocultar", async () => {
    const fetchMock = stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6), session("2026-01-15T10:00:00.000Z", 6)]);
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: /ver mi historial/i }));

    const months = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(months).toEqual(["septiembre de 2026", "enero de 2026"]);
    expect(screen.getByText(/Economía: 6 → 4/)).toBeInTheDocument();
    expect(screen.getByText(/Economía: 6$/)).toBeInTheDocument();

    const callsBefore = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /ocultar historial/i }));
    expect(screen.queryByText(/Economía: 6 → 4/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ver mi historial/i }));
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it("con más de 5 guardados enseña los 5 más recientes y 'Ver más' muestra el resto", async () => {
    const sessions = [9, 8, 7, 6, 5, 4, 3].map((month, index) => session(`2026-0${month}-10T10:00:00.000Z`, index + 1));
    stubHistory(sessions);
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: /ver mi historial \(7\)/i }));
    const list = screen.getByRole("list", { name: /historial de cambios/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
  });

  it("sin guardados lo dice y no hay botón", async () => {
    stubHistory([]);
    render(withClient(<HistoryTimeline />));

    expect(await screen.findByText("Todavía no has guardado nada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ver mi historial/i })).not.toBeInTheDocument();
  });

  it("en inglés, cada cambio usa el nombre traducido de la categoría", async () => {
    await i18n.changeLanguage("en");
    stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6)]);
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: /see my history/i }));
    expect(await screen.findByText(/Finances: 6 → 4/)).toBeInTheDocument();
  });

  it("las experiencias del diario salen en su día, bajo su categoría; la nota antigua de la evaluación ya no (RF-44)", async () => {
    stubHistory(
      [{ recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 4, previousScore: 6, note: "Nota antigua copiada" }] }],
      [{ id: "e1", categoryId: "c1", text: "Nota antigua copiada", createdAt: "2026-09-18T10:00:00.000Z" }, { id: "e2", categoryId: "c1", text: "Otra del mismo día", createdAt: "2026-09-18T20:00:00.000Z" }],
    );
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: /ver mi historial/i }));
    expect(await screen.findByText("«Otra del mismo día»")).toBeInTheDocument();
    expect(screen.getAllByText("«Nota antigua copiada»")).toHaveLength(1);
  });

  it("un día con experiencias pero sin puntuaciones también sale, con la categoría y sus experiencias (RF-44)", async () => {
    stubHistory(
      [{ recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 4 }] }],
      [{ id: "e1", categoryId: "c1", text: "Solo escribí", createdAt: "2026-09-25T10:00:00.000Z" }],
    );
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: "Ver mi historial (2)" }));
    const items = within(screen.getByRole("list", { name: /historial de cambios/i })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("25 de septiembre");
    expect(items[0]).toHaveTextContent("Economía");
    expect(items[0]).toHaveTextContent("«Solo escribí»");
  });

  it("agrupa por día: lo guardado categoría a categoría el mismo día sale junto, con el cambio del día y todas sus experiencias (UX-05)", async () => {
    stubHistory(
      [
        { recordedAt: "2026-09-18T18:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 3, previousScore: 4 }] },
        { recordedAt: "2026-09-18T11:00:00.000Z", entries: [{ categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", score: 7, previousScore: 5 }] },
        { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 4, previousScore: 6 }] },
        // La primera vez que se puntúa Deporte (sin "antes"): el cambio del día empieza en esta puntuación.
        { recordedAt: "2026-09-18T09:00:00.000Z", entries: [{ categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte", score: 5 }] },
        session("2026-09-02T10:00:00.000Z", 6, 5),
      ],
      [
        { id: "e2", categoryId: "c1", text: "Al final peor", createdAt: "2026-09-18T18:00:00.000Z" },
        { id: "e1", categoryId: "c1", text: "Mes justo", createdAt: "2026-09-18T10:00:00.000Z" },
      ],
    );
    render(withClient(<HistoryTimeline />));

    fireEvent.click(await screen.findByRole("button", { name: "Ver mi historial (2)" }));
    const items = within(screen.getByRole("list", { name: /historial de cambios/i })).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("18 de septiembre");
    expect(items[0]).toHaveTextContent("Economía: 6 → 3");
    expect(items[0]).toHaveTextContent("Deporte: 5 → 7");
    expect(within(items[0]).getByText("«Al final peor»")).toBeInTheDocument();
    expect(within(items[0]).getByText("«Mes justo»")).toBeInTheDocument();
    expect(items[1]).toHaveTextContent("Economía: 5 → 6");
  });
});
