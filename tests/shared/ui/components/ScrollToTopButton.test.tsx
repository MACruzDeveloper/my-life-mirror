// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "@shared/ui/i18n";
import { ScrollToTopButton } from "@shared/ui/components/ScrollToTopButton";

function scrollPageTo(y: number) {
  Object.defineProperty(window, "pageYOffset", { value: y, configurable: true });
  fireEvent.scroll(window);
}

describe("ScrollToTopButton", () => {
  afterEach(() => {
    scrollPageTo(0);
    vi.restoreAllMocks();
  });

  it("no se ve arriba del todo; al bajar aparece con un fundido y lleva arriba", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<ScrollToTopButton />);
    // Mientras está oculto, el lector de pantalla no lo ve (ni su nombre): se busca por su etiqueta.
    const button = screen.getByLabelText("Volver arriba");
    expect(button).not.toBeVisible();

    scrollPageTo(900);

    await waitFor(() => expect(button).toBeVisible());
    expect(screen.getByRole("button", { name: "Volver arriba" })).toBe(button);
    fireEvent.click(button);
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
