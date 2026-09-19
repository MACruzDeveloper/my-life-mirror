// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { AdminPage } from "@modules/admin/ui/AdminPage";

function stub(ok: boolean, status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok, status, json: async () => body })));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminPage (ADM-01)", () => {
  it("muestra los usuarios registrados con su rol", async () => {
    stub(true, 200, [
      { id: "1", email: "ana@ejemplo.com", rol: "usuario", createdAt: "2026-09-18T10:00:00.000Z", lastSignInAt: "2026-09-19T08:00:00.000Z" },
      { id: "2", email: "admin@ejemplo.com", rol: "admin", createdAt: "2026-09-01T10:00:00.000Z" },
    ]);
    renderPage();

    expect(await screen.findByText("ana@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText("admin@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("si la API responde 403 no muestra datos, solo que no hay permiso", async () => {
    stub(false, 403, { error: "Forbidden" });
    renderPage();

    expect(await screen.findByText(/no tienes permiso/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra un error genérico si la carga falla por otra causa", async () => {
    stub(false, 500, { error: "x" });
    renderPage();

    expect(await screen.findByText(/no se pudieron cargar los usuarios/i)).toBeInTheDocument();
  });

  it("ofrece una pestaña Categorías que carga el catálogo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            url === "/api/admin/categories" ? [{ id: "k1", name: "Economía", description: "d", isSensitiveData: false }] : [],
        }),
      ),
    );
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Categorías" }));

    expect(await screen.findByText("Economía")).toBeInTheDocument();
  });
});
