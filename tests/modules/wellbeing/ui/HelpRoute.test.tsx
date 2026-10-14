// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { HelpRoute } from "@modules/wellbeing/ui/HelpPage";

function renderAt(session: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => session }));
  return render(
    <MemoryRouter initialEntries={["/ayuda"]}>
      <Routes>
        <Route path="/ayuda" element={<HelpRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HelpRoute (RF-30): se puede salir de la ayuda", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sin sesión, con las migas hacia la portada", async () => {
    renderAt({ autenticado: false });

    const breadcrumbs = await screen.findByRole("navigation", { name: "breadcrumb" });
    expect(within(breadcrumbs).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(within(breadcrumbs).getByText("Ayuda")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "¿Necesitas ayuda ahora?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });

  it("con sesión, con la cabecera de la app y las migas hacia Inicio", async () => {
    renderAt({ autenticado: true, email: "ana@ejemplo.com", name: "Ana" });

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ana/ })).toHaveAttribute("aria-haspopup", "menu");
    const breadcrumbs = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(within(breadcrumbs).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/inicio");
    expect(screen.getByRole("heading", { level: 1, name: "¿Necesitas ayuda ahora?" })).toBeInTheDocument();
  });

  it("en la propia ayuda, el pie no enlaza a sí misma", async () => {
    renderAt({ autenticado: false });

    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("link", { name: "¿Necesitas ayuda ahora?" })).not.toBeInTheDocument();
  });
});
