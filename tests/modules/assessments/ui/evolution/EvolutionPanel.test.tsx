// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setOption = vi.fn();
vi.mock("echarts/core", () => ({ use: vi.fn(), init: vi.fn(() => ({ setOption, resize: vi.fn(), dispose: vi.fn() })) }));

import { EvolutionPanel } from "@modules/assessments/ui/evolution/EvolutionPanel";

const LATEST_SCORES = [
  { categoryId: "c1", categoryName: "Economía", score: 7 },
  { categoryId: "c2", categoryName: "Deporte", score: 3 },
];
const SESSIONS = [
  { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 7 }, { categoryId: "c2", categoryName: "Deporte", score: 3 }] },
  { recordedAt: "2025-02-10T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 4 }] },
];

/** Una llamada a setOption por tarjeta: las dos últimas deben compartir ventana. */
function lastWindows() {
  return setOption.mock.calls.slice(-2).map(([option]) => [option.xAxis.min, option.xAxis.max]);
}

describe("EvolutionPanel: periodo común (RF-16)", () => {
  beforeEach(() => {
    setOption.mockClear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-26T12:00:00"));
  });

  it("una tarjeta por categoría activa, todas con la misma ventana; por defecto los últimos 12 meses", () => {
    render(<EvolutionPanel latestScores={LATEST_SCORES} sessions={SESSIONS} />);

    expect(screen.getAllByRole("region")).toHaveLength(2);
    const [first, second] = lastWindows();
    expect(first).toEqual(second);
    expect(new Date(first[0])).toEqual(new Date("2025-10-01T00:00:00"));
    expect(screen.getByRole("button", { name: /12 meses/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("cambiar a 'Todo' o a '6 meses' cambia la ventana de todas a la vez", () => {
    render(<EvolutionPanel latestScores={LATEST_SCORES} sessions={SESSIONS} />);

    fireEvent.click(screen.getByRole("button", { name: /^todo$/i }));
    const [allA, allB] = lastWindows();
    expect(allA).toEqual(allB);
    expect(new Date(allA[0])).toEqual(new Date("2025-02-01T00:00:00"));

    fireEvent.click(screen.getByRole("button", { name: /6 meses/i }));
    const [sixA, sixB] = lastWindows();
    expect(sixA).toEqual(sixB);
    expect(new Date(sixA[0])).toEqual(new Date("2026-04-01T00:00:00"));
  });

  it("se puede ir a periodos anteriores y volver, sin pasar del primer dato ni del mes actual", () => {
    render(<EvolutionPanel latestScores={LATEST_SCORES} sessions={SESSIONS} />);
    const previous = screen.getByRole("button", { name: /periodo anterior/i });
    const next = screen.getByRole("button", { name: /periodo siguiente/i });

    expect(next).toBeDisabled();
    fireEvent.click(previous);
    expect(new Date(lastWindows()[0][0])).toEqual(new Date("2024-10-01T00:00:00"));
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(screen.getByText(/oct[\s\S]*2024[\s\S]*sept[\s\S]*2025/i)).toBeInTheDocument();
  });

  it("mientras carga el historial no dibuja gráficos, y si falla lo dice sin romper las tarjetas", () => {
    const { rerender } = render(<EvolutionPanel latestScores={LATEST_SCORES} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);

    rerender(<EvolutionPanel latestScores={LATEST_SCORES} historyError />);
    expect(screen.getAllByText(/no se pudo cargar la evolución/i)).toHaveLength(2);
  });
});
