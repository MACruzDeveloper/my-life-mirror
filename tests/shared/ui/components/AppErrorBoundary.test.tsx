// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { AppErrorBoundary } from "@shared/ui/components/AppErrorBoundary";

function BrokenScreen(): never {
  throw new Error("fallo al pintar");
}

describe("AppErrorBoundary (UX-14)", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("es");
  });

  it("sin fallos, enseña la pantalla tal cual", () => {
    render(
      <AppErrorBoundary>
        <p>Contenido</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Algo ha fallado" })).not.toBeInTheDocument();
  });

  it("si una pantalla falla al pintarse, enseña el aviso con 'Recargar' e 'Ir al inicio' en lugar de una pantalla en blanco", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, reload });

    render(
      <AppErrorBoundary>
        <BrokenScreen />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Algo ha fallado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    fireEvent.click(screen.getByRole("button", { name: "Recargar" }));
    expect(reload).toHaveBeenCalled();
  });

  it("en inglés, el aviso sale en inglés", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await i18n.changeLanguage("en");

    render(
      <AppErrorBoundary>
        <BrokenScreen />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});
