// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { ProtectedLayout } from "@shared/ui/components/ProtectedLayout";
import { SessionProvider, useSession } from "@shared/ui/context/SessionContext";

describe("ProtectedLayout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el Header, las migas de pan (si se pasan) y el contenido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) }),
    );

    render(
      <MemoryRouter>
        <SessionProvider>
          <ProtectedLayout breadcrumbs={[{ label: "Inicio", path: "/inicio" }, { label: "Perfil" }]}>
            <div>Contenido de la página</div>
          </ProtectedLayout>
        </SessionProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument());
    expect(screen.getByText("MyLifeMirror")).toBeInTheDocument();
    const breadcrumbs = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(within(breadcrumbs).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/inicio");
    expect(within(breadcrumbs).getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Contenido de la página")).toBeInTheDocument();
    // RF-30: al pie de toda pantalla protegida, igual para todo el mundo.
    expect(within(screen.getByRole("contentinfo")).getByRole("link", { name: "¿Necesitas ayuda ahora?" })).toHaveAttribute("href", "/ayuda");
  });

  it("muestra el nombre en vez del email cuando el perfil ya lo tiene (/api/sesion)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com", name: "Ana" }) }),
    );

    render(
      <MemoryRouter>
        <SessionProvider>
          <ProtectedLayout>
            <div>Contenido</div>
          </ProtectedLayout>
        </SessionProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());
    expect(screen.queryByText("ana@ejemplo.com")).not.toBeInTheDocument();
  });

  it("no muestra breadcrumbs si no se pasan migas", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) }),
    );

    render(
      <MemoryRouter>
        <SessionProvider>
          <ProtectedLayout>
            <div>Contenido</div>
          </ProtectedLayout>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("navigation", { name: "breadcrumb" })).not.toBeInTheDocument();
  });

  it("cerrar sesión llama a /api/logout y vuelve a la portada (no al inicio de sesión)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) })
      .mockResolvedValueOnce({ json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route
            path="/inicio"
            element={
              <SessionProvider>
                <ProtectedLayout>
                  <div>Contenido</div>
                </ProtectedLayout>
              </SessionProvider>
            }
          />
          <Route path="/" element={<div>La portada</div>} />
          <Route path="/login" element={<div>Pantalla de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/accounts/logout", { method: "POST" }));
    await waitFor(() => expect(screen.getByText("La portada")).toBeInTheDocument());
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });

  it("refresh() del contexto actualiza lo que muestra el Header sin desmontar la página", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) })
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com", name: "Ana" }) });
    vi.stubGlobal("fetch", fetchMock);

    function ContentWithRefreshButton() {
      const { refresh } = useSession();
      return (
        <button type="button" onClick={refresh}>
          refrescar
        </button>
      );
    }

    render(
      <MemoryRouter>
        <SessionProvider>
          <ProtectedLayout>
            <ContentWithRefreshButton />
          </ProtectedLayout>
        </SessionProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "refrescar" }));

    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());
    expect(screen.queryByText("ana@ejemplo.com")).not.toBeInTheDocument();
  });
});
