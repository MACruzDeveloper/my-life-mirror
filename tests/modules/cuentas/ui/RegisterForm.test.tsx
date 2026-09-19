// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
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

  it("si el registro deja la sesión iniciada, va directo a /inicio", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", email: "ana@ejemplo.com", sesionIniciada: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/registro"]}>
        <Routes>
          <Route path="/registro" element={<RegisterForm />} />
          <Route path="/inicio" element={<div>Página de inicio</div>} />
        </Routes>
      </MemoryRouter>,
    );
    completarYEnviar();

    await waitFor(() => expect(screen.getByText("Página de inicio")).toBeInTheDocument());
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo).toEqual({ name: "Ana", email: "ana@ejemplo.com", password: "12345678" });
  });

  it("si la cuenta se crea pero la sesión no, confirma y ofrece iniciar sesión a mano", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "1", email: "ana@ejemplo.com", sesionIniciada: false }) }),
    );

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );
    completarYEnviar();

    await waitFor(() => expect(screen.getByText(/cuenta creada/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
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
