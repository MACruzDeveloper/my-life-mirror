// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const init = vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: (...args: unknown[]) => init(...(args as [])) }));

import { CategoryEvolutionCard } from "@modules/assessments/ui/evolution/CategoryEvolutionCard";

const point = (score: number, iso: string) => ({ score, recordedAt: new Date(iso) });
const WINDOW = { start: new Date("2026-01-01T00:00:00"), end: new Date("2026-10-01T00:00:00") };

describe("CategoryEvolutionCard (RF-14 + RF-16)", () => {
  beforeEach(() => init.mockClear());

  it("muestra el nombre y la puntuación actual, y deja un hueco para contenido extra", () => {
    render(<CategoryEvolutionCard categoryName="Economía" currentScore={7} points={[point(7, "2026-09-18T10:00:00")]} window={WINDOW} extra={<span>extra</span>} />);

    const card = screen.getByRole("region", { name: "Economía" });
    expect(within(card).getByText("7")).toBeInTheDocument();
    expect(within(card).getByText("extra")).toBeInTheDocument();
  });

  it("sin puntuaciones dice que está sin puntuar y no crea gráfico", () => {
    render(<CategoryEvolutionCard categoryName="Familia" points={[]} window={WINDOW} />);

    expect(screen.getByText(/sin puntuar todavía/i)).toBeInTheDocument();
    expect(init).not.toHaveBeenCalled();
  });

  it("con una sola puntuación explica cuándo aparece la evolución", () => {
    render(<CategoryEvolutionCard categoryName="Deporte" currentScore={5} points={[point(5, "2026-01-15T10:00:00")]} window={WINDOW} />);

    expect(screen.getByText(/segunda respuesta/i)).toBeInTheDocument();
  });

  it("describe el gráfico (primera y última, con fechas) y ofrece la tabla de datos", () => {
    render(
      <CategoryEvolutionCard
        categoryName="Economía"
        currentScore={7}
        points={[point(3, "2026-01-15T10:00:00"), point(7, "2026-09-18T10:00:00")]}
        window={WINDOW}
      />,
    );

    expect(screen.getByRole("img", { name: /evolución de economía[\s\S]*3[\s\S]*7[\s\S]*2026/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ver datos/i }));
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[2]).toHaveTextContent(/2026[\s\S]*7/);
  });

  it("en inglés, el título y la descripción del gráfico usan el nombre traducido", async () => {
    const i18n = (await import("@shared/ui/i18n")).default;
    await i18n.changeLanguage("en");
    try {
      render(<CategoryEvolutionCard categoryName="Economía" currentScore={7} points={[point(3, "2026-01-15T10:00:00"), point(7, "2026-09-18T10:00:00")]} window={WINDOW} />);

      expect(screen.getByRole("region", { name: "Finances" })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /finances/i })).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("es");
    }
  });
});
