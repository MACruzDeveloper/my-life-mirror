// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { NotificationsBell } from "@modules/panel/ui/notifications/NotificationsBell";
import { withClient } from "../../../../helpers/queryClient";

const DATA: Record<string, unknown> = {
  "/api/agenda/events": [{ id: "e1", title: "Boda de Marta", day: "2026-10-10", categoryIds: ["c1"] }],
  "/api/recommendations/reactions": [],
  "/api/assessments": [],
  "/api/categories": [{ id: "c1", catalogId: "k-social", name: "Vida social", status: "active" }],
  "/api/categories/translations": [{ catalogId: "k-social", key: "vidaSocial", translations: { es: { name: "Vida social", description: "" } } }],
};

function renderBell() {
  return render(withClient(<MemoryRouter><NotificationsBell /></MemoryRouter>));
}

describe("NotificationsBell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 12));
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, json: async () => DATA[url] ?? [] })));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("dice cuántos avisos nuevos hay; al abrirla se ven y el contador desaparece, también al volver", async () => {
    const view = renderBell();

    const bell = await screen.findByRole("button", { name: "Avisos: 1 nuevo" });
    fireEvent.click(bell);

    const list = within(screen.getByRole("dialog", { name: "Avisos" }));
    expect(list.getByRole("link", { name: /¿cómo fue «boda de marta»\?/i })).toHaveAttribute("href", "/perfil/entrevista");
    // Con la lista abierta, el resto de la página queda oculto para el lector de pantalla (por eso `hidden`).
    expect(screen.getByRole("button", { name: "Avisos", hidden: true })).toBeInTheDocument();
    view.unmount();

    renderBell();
    expect(await screen.findByRole("button", { name: "Avisos" })).toBeInTheDocument();
  });

  it("sin avisos, lo dice", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })));
    renderBell();

    fireEvent.click(await screen.findByRole("button", { name: "Avisos" }));

    expect(screen.getByText(/no tienes avisos/i)).toBeInTheDocument();
  });
});
