// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "@shared/ui/i18n";
import { PageLoader } from "@shared/ui/components/PageLoader";

describe("PageLoader", () => {
  it("anuncia la carga con un nombre accesible", () => {
    render(<PageLoader />);

    expect(screen.getByRole("progressbar", { name: "Cargando…" })).toBeInTheDocument();
  });

  // Fallo real (Lighthouse, 18 oct.): con `mt` el margen colapsaba hasta el body y toda la página saltaba 64 px al cargar.
  it("separa el indicador con relleno, no con margen", () => {
    render(<PageLoader />);

    const box = screen.getByRole("progressbar").parentElement!;
    expect(getComputedStyle(box).paddingTop).toBe("64px");
    expect(["", "0px"]).toContain(getComputedStyle(box).marginTop);
  });
});
