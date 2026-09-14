// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { Home } from "@modules/panel/ui/Home";

describe("Home (RF-39, placeholder de RF-14)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saluda con el email de la sesión activa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) }),
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/ana@ejemplo.com/)).toBeInTheDocument());
  });

  it("cerrar sesión llama a /api/logout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) })
      .mockResolvedValueOnce({ json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/ana@ejemplo.com/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/logout", { method: "POST" }));
  });
});
