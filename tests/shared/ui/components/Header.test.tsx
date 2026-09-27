// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import i18n from "@shared/ui/i18n";
import { Header } from "@shared/ui/components/Header";

function renderHeader(props: Partial<React.ComponentProps<typeof Header>> = {}) {
  return render(
    <MemoryRouter>
      <Header displayName="ana@ejemplo.com" onLogout={() => {}} {...props} />
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

  it("incluye un enlace a /inicio, a la izquierda de Administración", () => {
    renderHeader({ isAdmin: true });

    const homeLink = screen.getByRole("link", { name: /inicio/i });
    expect(homeLink).toHaveAttribute("href", "/inicio");
    const adminLink = screen.getByRole("link", { name: /administración/i });
    expect(homeLink.compareDocumentPosition(adminLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("el enlace de administración solo aparece para un admin", () => {
    const { unmount } = renderHeader();
    expect(screen.queryByRole("link", { name: /administración/i })).not.toBeInTheDocument();
    unmount();

    renderHeader({ isAdmin: true });
    expect(screen.getByRole("link", { name: /administración/i })).toHaveAttribute("href", "/admin");
  });

  it("el botón de cerrar sesión llama al callback recibido", () => {
    const onLogout = vi.fn();
    renderHeader({ onLogout });

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("el selector de idioma cambia el idioma activo", async () => {
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  describe("en móvil (UX-03)", () => {
    function narrowScreen() {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }));
    }

    afterEach(() => vi.unstubAllGlobals());

    it("muestra logo, idioma y un botón de menú, sin los enlaces sueltos", () => {
      narrowScreen();
      renderHeader({ isAdmin: true });

      expect(screen.getByText("MyLifeMirror")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /inicio/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /cerrar sesión/i })).not.toBeInTheDocument();
    });

    it("el menú lleva la navegación, el nombre de la sesión y cerrar sesión", () => {
      narrowScreen();
      const onLogout = vi.fn();
      renderHeader({ onLogout });

      fireEvent.click(screen.getByRole("button", { name: /abrir menú/i }));
      const menu = screen.getByRole("menu");
      expect(within(menu).getByRole("menuitem", { name: /inicio/i })).toHaveAttribute("href", "/inicio");
      expect(within(menu).getByRole("menuitem", { name: /mi perfil/i })).toHaveAttribute("href", "/perfil");
      expect(within(menu).queryByRole("menuitem", { name: /administración/i })).not.toBeInTheDocument();
      expect(within(menu).getByText("ana@ejemplo.com")).toBeInTheDocument();

      fireEvent.click(within(menu).getByRole("menuitem", { name: /cerrar sesión/i }));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("un admin ve también Administración en el menú", () => {
      narrowScreen();
      renderHeader({ isAdmin: true });

      fireEvent.click(screen.getByRole("button", { name: /abrir menú/i }));
      expect(within(screen.getByRole("menu")).getByRole("menuitem", { name: /administración/i })).toHaveAttribute("href", "/admin");
    });

    it("en pantalla ancha no hay botón de menú", () => {
      renderHeader();

      expect(screen.queryByRole("button", { name: /abrir menú/i })).not.toBeInTheDocument();
    });
  });
});
