// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import i18n from "@shared/ui/i18n";
import { Header } from "@shared/ui/components/Header";
import { HeaderExtrasProvider } from "@shared/ui/context/HeaderExtrasContext";

function renderHeader(props: Partial<React.ComponentProps<typeof Header>> = {}, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
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

  it("la navegación lleva a Inicio, Categorías y Entrevista", () => {
    renderHeader();

    const nav = within(screen.getByRole("navigation"));
    expect(nav.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/inicio");
    expect(nav.getByRole("link", { name: "Categorías" })).toHaveAttribute("href", "/categorias");
    expect(nav.getByRole("link", { name: "Entrevista" })).toHaveAttribute("href", "/perfil/entrevista");
  });

  it("en una landing va transparente arriba del todo y sin espaciador; si no, con su fondo", () => {
    const { unmount } = renderHeader({ overlay: true });
    expect(screen.getByRole("banner")).toHaveAttribute("data-transparent", "true");
    expect(screen.queryByTestId("header-spacer")).not.toBeInTheDocument();
    unmount();

    renderHeader();
    expect(screen.getByRole("banner")).toHaveAttribute("data-transparent", "false");
    expect(screen.getByTestId("header-spacer")).toBeInTheDocument();
  });

  it("marca la página en la que se está (también dentro de ella, como una categoría), con el estilo de pasar el ratón", () => {
    renderHeader({}, "/categorias/aventura");

    const nav = within(screen.getByRole("navigation"));
    expect(nav.getByRole("link", { name: "Categorías" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
    expect(nav.getByRole("link", { name: "Entrevista" })).not.toHaveAttribute("aria-current");
  });

  it("el nombre abre un menú con Mi perfil y Cerrar sesión; Administración, solo para un admin", () => {
    const onLogout = vi.fn();
    const { unmount } = renderHeader({ onLogout });

    fireEvent.click(screen.getByRole("button", { name: /ana@ejemplo\.com/ }));
    let menu = within(screen.getByRole("menu"));
    expect(menu.getByRole("menuitem", { name: "Mi perfil" })).toHaveAttribute("href", "/perfil");
    expect(menu.queryByRole("menuitem", { name: /administración/i })).not.toBeInTheDocument();
    fireEvent.click(menu.getByRole("menuitem", { name: "Cerrar sesión" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    unmount();

    renderHeader({ isAdmin: true });
    fireEvent.click(screen.getByRole("button", { name: /ana@ejemplo\.com/ }));
    menu = within(screen.getByRole("menu"));
    expect(menu.getByRole("menuitem", { name: /administración/i })).toHaveAttribute("href", "/admin");
  });

  it("el selector de idioma es de texto (ES | EN), sin banderas, y cambia el idioma activo", async () => {
    renderHeader();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("muestra lo que la página le pase como avisos (la campana), a la derecha del todo", () => {
    render(
      <MemoryRouter>
        <HeaderExtrasProvider notifications={<button type="button">campana</button>}>
          <Header displayName="ana@ejemplo.com" onLogout={() => {}} />
        </HeaderExtrasProvider>
      </MemoryRouter>,
    );

    const bell = screen.getByRole("button", { name: "campana" });
    expect(screen.getByRole("button", { name: "English" }).compareDocumentPosition(bell) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      expect(within(menu).getByRole("menuitem", { name: "Categorías" })).toHaveAttribute("href", "/categorias");
      expect(within(menu).getByRole("menuitem", { name: "Entrevista" })).toHaveAttribute("href", "/perfil/entrevista");
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

  describe("fijo y compacto al desplazarse (UX-06)", () => {
    afterEach(() => {
      Object.defineProperty(window, "pageYOffset", { value: 0, configurable: true });
    });

    it("empieza a tamaño normal y se compacta al bajar; vuelve al subir", () => {
      renderHeader();
      const header = screen.getByRole("banner");
      expect(header).toHaveAttribute("data-compact", "false");

      Object.defineProperty(window, "pageYOffset", { value: 120, configurable: true });
      fireEvent.scroll(window);
      expect(header).toHaveAttribute("data-compact", "true");

      Object.defineProperty(window, "pageYOffset", { value: 0, configurable: true });
      fireEvent.scroll(window);
      expect(header).toHaveAttribute("data-compact", "false");
    });
  });

  it("RF-26: con avatar elegido lo enseña junto al nombre; sin él, solo el nombre", () => {
    const { unmount } = renderHeader({ displayName: "Ana", avatarKey: "longBraids" });
    expect(screen.getByRole("img", { name: /dos trenzas largas/i })).toHaveAttribute("src", "/avatars/longBraids.webp");
    unmount();

    renderHeader({ displayName: "Ana" });
    expect(screen.queryByRole("img", { name: /dos trenzas largas/i })).not.toBeInTheDocument();
  });

  it("en escritorio separa cuatro grupos: páginas, cuenta (avatar y nombre, que abren el menú), idioma y avisos", () => {
    renderHeader({ displayName: "Ana", avatarKey: "longBraids" });

    const pages = screen.getByRole("navigation", { name: "Páginas" });
    expect(within(pages).getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(within(pages).queryByRole("link", { name: "Mi perfil" })).not.toBeInTheDocument();
    expect(within(pages).queryByText("Ana")).not.toBeInTheDocument();

    const account = screen.getByRole("group", { name: "Mi cuenta" });
    const accountButton = within(account).getByRole("button", { name: /Ana/ });
    expect(within(accountButton).getByRole("img", { name: /dos trenzas largas/i })).toBeInTheDocument();
    expect(accountButton).toHaveAttribute("aria-haspopup", "menu");

    // El idioma va después de la cuenta, fuera de ella.
    const english = screen.getByRole("button", { name: "English" });
    expect(account.compareDocumentPosition(english) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(account).queryByRole("button", { name: "English" })).not.toBeInTheDocument();
  });
});
