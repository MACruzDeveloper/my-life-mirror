// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { Header } from "@shared/ui/Header";

describe("Header", () => {
  afterEach(async () => {
    await i18n.changeLanguage("es");
  });

  it("muestra el logo de texto y el email de la sesión activa", () => {
    render(<Header email="ana@ejemplo.com" onCerrarSesion={() => {}} />);

    expect(screen.getByText("MyLifeMirror")).toBeInTheDocument();
    expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument();
  });

  it("el botón de cerrar sesión llama al callback recibido", () => {
    const onCerrarSesion = vi.fn();
    render(<Header email="ana@ejemplo.com" onCerrarSesion={onCerrarSesion} />);

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("el selector de idioma cambia el idioma activo", async () => {
    render(<Header email="ana@ejemplo.com" onCerrarSesion={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
  });
});
