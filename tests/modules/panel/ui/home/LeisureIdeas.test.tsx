// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "@shared/ui/i18n";
import { LeisureIdeas } from "@modules/panel/ui/home/LeisureIdeas";

describe("LeisureIdeas (RF-50)", () => {
  it("con todo en verde, dice que no hace falta mejorar nada y enseña una idea para disfrutar, con el aviso", () => {
    render(<LeisureIdeas scores={[9, 8, 10]} />);

    const card = screen.getByRole("region", { name: "Todo va bien" });
    expect(within(card).getByText(/no hace falta mejorar nada/i)).toBeInTheDocument();
    expect(within(card).getByText(/regálate un rato solo para ti/i)).toBeInTheDocument();
    expect(within(card).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
  });

  it("'Otra idea' pasa a la siguiente y, tras la última, vuelve a la primera", () => {
    render(<LeisureIdeas scores={[9, 8, 10]} />);
    const card = screen.getByRole("region", { name: "Todo va bien" });
    const next = within(card).getByRole("button", { name: "Otra idea" });

    fireEvent.click(next);
    expect(within(card).queryByText(/regálate un rato solo para ti/i)).not.toBeInTheDocument();
    for (let step = 1; step < 8; step += 1) fireEvent.click(next);
    expect(within(card).getByText(/regálate un rato solo para ti/i)).toBeInTheDocument();
  });

  it("si algo no está en verde, no se pinta", () => {
    const { container } = render(<LeisureIdeas scores={[9, 8, 6]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
