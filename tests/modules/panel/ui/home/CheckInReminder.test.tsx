// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { CheckInReminder } from "@modules/panel/ui/home/CheckInReminder";
import { staleCategories } from "@modules/panel/ui/home/staleCategories";

const NOW = new Date("2026-10-12T10:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const score = (categoryName: string, days: number | undefined, value: number | undefined = 7) => ({ categoryId: categoryName, categoryName, score: value, ...(days !== undefined && { recordedAt: daysAgo(days) }) });

describe("categorías que llevan tiempo sin mirarse (UX-10)", () => {
  it("son las puntuadas hace más de 30 días, la más antigua primero, tres como mucho", () => {
    const stale = staleCategories([score("Deporte", 45), score("Economía", 10), score("Familia", 90), score("Aventura", 31), score("Idiomas", 60)], NOW);

    expect(stale.map((item) => item.categoryName)).toEqual(["Familia", "Idiomas", "Deporte"]);
    expect(stale[0].weeks).toBe(12);
  });

  it("no cuenta las que nunca se han puntuado ni las recientes", () => {
    expect(staleCategories([score("Deporte", undefined, undefined), score("Economía", 30), score("Familia", 2)], NOW)).toEqual([]);
  });

  it("invita, sin presionar: nombra cada categoría con su tiempo y enlaza a la entrevista", () => {
    render(
      <MemoryRouter>
        <CheckInReminder latestScores={[score("Deporte", 45), score("Economía", 10)]} now={NOW} />
      </MemoryRouter>,
    );

    const reminder = screen.getByRole("region", { name: /hace tiempo que no miras/i });
    expect(within(reminder).getByText(/deporte/i)).toHaveTextContent(/6 semanas/i);
    expect(within(reminder).queryByText(/economía/i)).not.toBeInTheDocument();
    expect(within(reminder).getByText(/sigue igual/i)).toBeInTheDocument();
    expect(within(reminder).getByRole("link", { name: /actualizar mis respuestas/i })).toHaveAttribute("href", "/perfil/entrevista");
    // Ni avisos ni urgencias.
    expect(reminder).not.toHaveTextContent(/debes|tienes que|cuidado|no te relajes/i);
  });

  it("sin nada pendiente no pinta nada", () => {
    const { container } = render(
      <MemoryRouter>
        <CheckInReminder latestScores={[score("Economía", 3)]} now={NOW} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
