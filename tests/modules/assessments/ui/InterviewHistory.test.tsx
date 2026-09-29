// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { InterviewHistory } from "@modules/assessments/ui/InterviewHistory";
import { withClient } from "../../../helpers/queryClient";
import { categoryLabelsFixture } from "../../../helpers/categoryLabels";

const session = (recordedAt: string, score: number, previousScore?: number) => ({
  recordedAt,
  entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score, ...(previousScore !== undefined ? { previousScore } : {}) }],
});

function stubHistory(sessions: unknown[]) {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve({ ok: true, json: async () => (url === "/api/categories/translations" ? categoryLabelsFixture() : sessions) }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await i18n.changeLanguage("es");
});

describe("InterviewHistory (UX-04)", () => {
  it("empieza plegado: solo el botón con el número de guardados", async () => {
    stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6), session("2026-01-15T10:00:00.000Z", 6)]);
    render(withClient(<InterviewHistory />));

    expect(await screen.findByRole("button", { name: "Ver mi historial (2)" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Economía: 6 → 4/)).not.toBeInTheDocument();
  });

  it("al abrirlo agrupa por meses, del más reciente al más antiguo, y se puede volver a ocultar", async () => {
    const fetchMock = stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6), session("2026-01-15T10:00:00.000Z", 6)]);
    render(withClient(<InterviewHistory />));

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
    render(withClient(<InterviewHistory />));

    fireEvent.click(await screen.findByRole("button", { name: /ver mi historial \(7\)/i }));
    const list = screen.getByRole("list", { name: /historial de cambios/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
  });

  it("sin guardados lo dice y no hay botón", async () => {
    stubHistory([]);
    render(withClient(<InterviewHistory />));

    expect(await screen.findByText("Todavía no has guardado nada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ver mi historial/i })).not.toBeInTheDocument();
  });

  it("en inglés, cada cambio usa el nombre traducido de la categoría", async () => {
    await i18n.changeLanguage("en");
    stubHistory([session("2026-09-18T10:00:00.000Z", 4, 6)]);
    render(withClient(<InterviewHistory />));

    fireEvent.click(await screen.findByRole("button", { name: /see my history/i }));
    expect(await screen.findByText(/Finances: 6 → 4/)).toBeInTheDocument();
  });
});
