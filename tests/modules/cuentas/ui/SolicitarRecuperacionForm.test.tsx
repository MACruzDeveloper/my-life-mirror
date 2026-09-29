// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { SolicitarRecuperacionForm } from "@modules/cuentas/ui/SolicitarRecuperacionForm";

describe("SolicitarRecuperacionForm (RF-38)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el mismo mensaje de confirmación exista o no el email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mensaje: "Si el email existe..." }) }),
    );

    render(
      <MemoryRouter>
        <SolicitarRecuperacionForm />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@ejemplo.com" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(screen.getByText(/si el email existe/i)).toBeInTheDocument();
    });
  });
});
