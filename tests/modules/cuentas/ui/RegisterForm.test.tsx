// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { RegisterForm } from "@modules/cuentas/ui/RegisterForm";

function completarYEnviar() {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "12345678" } });
  fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));
}

describe("RegisterForm (RF-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra un mensaje de éxito cuando el registro se completa", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", email: "ana@ejemplo.com" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );
    completarYEnviar();

    await waitFor(() => {
      expect(screen.getByText(/cuenta creada/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");

    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo).toEqual({ name: "Ana", email: "ana@ejemplo.com", password: "12345678" });
  });

  it("muestra el mensaje de error que devuelve el servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Ya existe una cuenta con ese email" }),
      }),
    );

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );
    completarYEnviar();

    await waitFor(() => {
      expect(screen.getByText(/ya existe una cuenta/i)).toBeInTheDocument();
    });
  });
});
