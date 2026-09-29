// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PublicFormBox } from "@shared/ui/components/PublicFormBox";

describe("PublicFormBox", () => {
  it("envuelve el contenido de las páginas públicas y puede ser el propio formulario", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <PublicFormBox component="form" aria-label="Acceso" onSubmit={onSubmit}>
        <button type="submit">Enviar</button>
      </PublicFormBox>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(screen.getByRole("form", { name: "Acceso" })).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
