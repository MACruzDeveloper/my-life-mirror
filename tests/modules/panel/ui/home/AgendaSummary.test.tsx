// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { AgendaSummary } from "@modules/panel/ui/home/AgendaSummary";
import { withClient } from "../../../../helpers/queryClient";

const NAMES = { c1: "Vida social", c3: "Familia" };

function renderSummary(events: unknown[], reactions: unknown[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => Promise.resolve({ ok: true, json: async () => (url === "/api/agenda/events" ? events : url === "/api/recommendations/reactions" ? reactions : []) })),
  );
  return render(
    withClient(
      <MemoryRouter>
        <AgendaSummary categoryNames={NAMES} />
      </MemoryRouter>,
    ),
  );
}

describe("Agenda en Inicio (RF-48)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 13, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("enseña lo próximo (eventos e ideas con fecha), lo más cercano primero y hasta tres, con enlace al calendario", async () => {
    renderSummary(
      [
        { id: "e1", title: "Boda de Marta", day: "2026-10-24", categoryIds: ["c1"] },
        { id: "e2", title: "Excursión", day: "2026-11-02" },
        { id: "e3", title: "Viaje", day: "2026-12-01" },
      ],
      [{ categoryId: "c1", templateKey: "vidaSocial.1", reaction: "saved", reactedAt: "", plannedFor: "2026-10-20" }],
    );

    const section = await screen.findByRole("region", { name: /próximamente/i });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/20 de octubre/i);
    expect(items[1]).toHaveTextContent("Boda de Marta");
    expect(within(section).getByRole("link", { name: /ver el calendario/i })).toHaveAttribute("href", "/perfil/calendario");
  });

  it("desde el día del evento, invita a revisar la nota de sus categorías (no la cambia) con enlace a la entrevista", async () => {
    renderSummary([
      { id: "e1", title: "Boda de Marta", day: "2026-10-10", categoryIds: ["c1", "c3", "borrada"] },
      { id: "e2", title: "Comida familiar", day: "2026-10-13", categoryIds: ["c3"] },
    ]);

    const invitation = await screen.findByText(/¿cómo fue «Boda de Marta»\?/i);
    expect(invitation.closest("li")).toHaveTextContent(/revisa tu nota en Vida social y Familia\./i);
    // El mismo día del evento ya se invita.
    expect(screen.getByText(/¿cómo fue «Comida familiar»\?/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /revisar/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /revisar/i })[0]).toHaveAttribute("href", "/perfil/entrevista");
  });

  it("no invita por un evento sin categoría, ni por uno de hace más de 14 días, ni por uno que aún no ha llegado", async () => {
    renderSummary([
      { id: "e1", title: "Sin categoría", day: "2026-10-10", categoryIds: [] },
      { id: "e2", title: "Antiguo", day: "2026-09-20", categoryIds: ["c1"] },
      { id: "e3", title: "Mañana", day: "2026-10-14", categoryIds: ["c1"] },
    ]);

    await screen.findByRole("region", { name: /próximamente/i });
    expect(screen.queryByText(/¿cómo fue/i)).not.toBeInTheDocument();
  });

  it("la invitación se puede cerrar y no vuelve en este navegador", async () => {
    const view = renderSummary([{ id: "e1", title: "Boda de Marta", day: "2026-10-10", categoryIds: ["c1"] }]);
    fireEvent.click(await screen.findByRole("button", { name: /cerrar/i }));
    expect(screen.queryByText(/¿cómo fue/i)).not.toBeInTheDocument();
    view.unmount();

    renderSummary([{ id: "e1", title: "Boda de Marta", day: "2026-10-10", categoryIds: ["c1"] }]);
    await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
    expect(screen.queryByText(/¿cómo fue/i)).not.toBeInTheDocument();
  });

  it("sin nada próximo ni nada que revisar, no se pinta", async () => {
    const { container } = renderSummary([]);
    await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
