// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import i18n from "@shared/ui/i18n";
import { Header } from "@shared/ui/components/Header";

function renderHeader(props: Partial<React.ComponentProps<typeof Header>> = {}) {
  return render(
    <MemoryRouter>
      <Header displayName="ana@ejemplo.com" onCerrarSesion={() => {}} {...props} />
    </MemoryRouter>,
  );
}

describe("Header", () => {
  afterEach(async () => {
    await i18n.changeLanguage("es");
  });

  it("muestra el logo de texto y el nombre/email de la sesión activa", () => {
    renderHeader();

    expect(screen.getByText("MyLifeMirror")).toBeInTheDocument();
    expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument();
  });

  it("incluye un enlace a /perfil", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/perfil");
  });

  it("el enlace de administración solo aparece para un admin", () => {
    const { unmount } = renderHeader();
    expect(screen.queryByRole("link", { name: /administración/i })).not.toBeInTheDocument();
    unmount();

    renderHeader({ isAdmin: true });
    expect(screen.getByRole("link", { name: /administración/i })).toHaveAttribute("href", "/admin");
  });

  it("el botón de cerrar sesión llama al callback recibido", () => {
    const onCerrarSesion = vi.fn();
    renderHeader({ onCerrarSesion });

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("el selector de idioma cambia el idioma activo", async () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
  });
});
