// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setOption = vi.fn();
const init = vi.fn(() => ({ setOption, resize: vi.fn(), dispose: vi.fn() }));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: (...args: unknown[]) => init(...(args as [])) }));

import { BalanceCard } from "@modules/assessments/ui/balance/BalanceCard";

const SCORED = [
  { categoryId: "c1", categoryName: "Economía", score: 7 },
  { categoryId: "c3", categoryName: "Deporte", score: 3 },
  { categoryId: "c4", categoryName: "Aventura", score: 9 },
];

describe("BalanceCard (RF-15)", () => {
  beforeEach(() => {
    init.mockClear();
    setOption.mockClear();
  });

  it("con tres o más categorías puntuadas muestra el radar, descrito con cada categoría y su puntuación", () => {
    render(<BalanceCard latestScores={SCORED} />);

    const card = screen.getByRole("region", { name: /tu equilibrio/i });
    expect(within(card).getByRole("img", { name: /economía[\s\S]*7[\s\S]*deporte[\s\S]*3[\s\S]*aventura[\s\S]*9/i })).toBeInTheDocument();
    expect(init).toHaveBeenCalledOnce();
  });

  it("indica qué categorías activas faltan por puntuar", () => {
    render(<BalanceCard latestScores={[...SCORED, { categoryId: "c2", categoryName: "Familia" }, { categoryId: "c5", categoryName: "Pareja" }]} />);

    expect(screen.getByText(/faltan por puntuar[\s\S]*familia[\s\S]*pareja/i)).toBeInTheDocument();
  });

  it("con menos de tres puntuadas lo explica y no dibuja radar", () => {
    render(<BalanceCard latestScores={SCORED.slice(0, 2)} />);

    expect(screen.getByText(/a partir de la tercera categoría/i)).toBeInTheDocument();
    expect(init).not.toHaveBeenCalled();
  });

  it("'Ver datos' muestra cada categoría con su puntuación en una tabla", () => {
    render(<BalanceCard latestScores={SCORED} />);

    fireEvent.click(screen.getByRole("button", { name: /ver datos/i }));

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(rows[2]).toHaveTextContent(/deporte[\s\S]*3/i);
  });

  it("el tooltip lista cada categoría y su puntuación, escapando los nombres (los crea el admin y el tooltip es HTML)", () => {
    render(<BalanceCard latestScores={[...SCORED, { categoryId: "c9", categoryName: "<img src=x onerror=alert(1)>", score: 5 }]} />);

    const tooltip = setOption.mock.calls.at(-1)![0].tooltip.formatter();
    expect(tooltip).toContain("Economía: <strong>7</strong>");
    expect(tooltip).toContain("&lt;img src=x onerror=alert(1)&gt;: <strong>5</strong>");
    expect(tooltip).not.toContain("<img");
  });

});
