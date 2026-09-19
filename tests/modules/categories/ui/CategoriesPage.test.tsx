// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CategoriesPage } from "@modules/categories/ui/CategoriesPage";

const CATEGORIAS = [
  { id: "c1", name: "Economía", description: "Tus finanzas.", status: "inactive", isSensitiveData: false },
  { id: "c2", name: "Sexo", description: "Tu vida sexual.", status: "inactive", isSensitiveData: true },
];

function mockFetchLista() {
  return vi.fn((url: string) => {
    if (url === "/api/categories") {
      return Promise.resolve({ ok: true, json: async () => CATEGORIAS });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

describe("CategoriesPage (RF-06/RF-07)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lista las categorías del usuario", async () => {
    vi.stubGlobal("fetch", mockFetchLista());

    render(<CategoriesPage />);

    await waitFor(() => expect(screen.getByText("Economía")).toBeInTheDocument());
    expect(screen.getByText("Sexo")).toBeInTheDocument();
  });

  it("activa directamente una categoría no sensible", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIAS });
      if (url === "/api/categories/activate") {
        return Promise.resolve({ ok: true, json: async () => ({ ...CATEGORIAS[0], status: "active" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CategoriesPage />);
    await waitFor(() => expect(screen.getByText("Economía")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("switch", { name: "Economía" }));

    await waitFor(() => expect(screen.getByRole("switch", { name: "Economía" })).toBeChecked());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories/activate",
      expect.objectContaining({ body: JSON.stringify({ categoryId: "c1" }) }),
    );
  });

  it("pide consentimiento al intentar activar una categoría sensible, y activa tras aceptar", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIAS });
      if (url === "/api/categories/activate") {
        // Primera llamada: sin consentimiento. Segunda (tras aceptar): ya activa.
        const yaConsintio = fetchMock.mock.calls.some(([u]) => u === "/api/consent/grant");
        if (yaConsintio) {
          return Promise.resolve({ ok: true, json: async () => ({ ...CATEGORIAS[1], status: "active" }) });
        }
        return Promise.resolve({ ok: false, json: async () => ({ error: "Requiere consentimiento", code: "CONSENT_REQUIRED" }) });
      }
      if (url === "/api/consent/grant") {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CategoriesPage />);
    await waitFor(() => expect(screen.getByText("Sexo")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("switch", { name: "Sexo" }));

    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /leer la política de privacidad/i })).toHaveAttribute(
      "href",
      "/politica-privacidad",
    );
    fireEvent.click(screen.getByRole("button", { name: /aceptar y activar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/consent/grant", expect.anything()));
    await waitFor(() => expect(screen.getByRole("switch", { name: "Sexo" })).toBeChecked());
    expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument();
  });

  it("cancelar el modal de consentimiento deja la categoría inactiva", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIAS });
      if (url === "/api/categories/activate") {
        return Promise.resolve({ ok: false, json: async () => ({ error: "Requiere consentimiento", code: "CONSENT_REQUIRED" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CategoriesPage />);
    await waitFor(() => expect(screen.getByText("Sexo")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("switch", { name: "Sexo" }));
    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument());
    expect(screen.getByRole("switch", { name: "Sexo" })).not.toBeChecked();
  });

  it("desactiva una categoría activa sin pedir nada", async () => {
    const activa = [{ ...CATEGORIAS[0], status: "active" }];
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => activa });
      if (url === "/api/categories/deactivate") {
        return Promise.resolve({ ok: true, json: async () => ({ ...activa[0], status: "inactive" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CategoriesPage />);
    await waitFor(() => expect(screen.getByRole("switch", { name: "Economía" })).toBeChecked());

    fireEvent.click(screen.getByRole("switch", { name: "Economía" }));

    await waitFor(() => expect(screen.getByRole("switch", { name: "Economía" })).not.toBeChecked());
  });
});
