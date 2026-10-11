// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { LoginForm } from "@modules/accounts/ui/LoginForm";
import type { QueryClient } from "@tanstack/react-query";
import { createTestClient, withClient } from "../../../helpers/queryClient";

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "Bici-Azul-Lluvia-47" } });
  fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

function renderWithRoutes(client: QueryClient = createTestClient()) {
  return render(
    withClient(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/inicio" element={<div>Pantalla de inicio</div>} />
        </Routes>
      </MemoryRouter>,
      client,
    ),
  );
}

describe("LoginForm — enlace de recuperación", () => {
  it("incluye un enlace a /olvide-password", () => {
    renderWithRoutes();

    expect(screen.getByRole("link", { name: /olvidaste tu contraseña/i })).toHaveAttribute(
      "href",
      "/olvide-password",
    );
  });
});

describe("LoginForm (RF-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("navega a /inicio cuando el login se completa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "1", email: "ana@ejemplo.com" }),
      }),
    );

    renderWithRoutes();
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Pantalla de inicio")).toBeInTheDocument();
    });
  });

  it("si las credenciales no valen, un único mensaje sin pistas, sin navegar (SEC-01)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Email o contraseña incorrectos" }) }));

    renderWithRoutes();
    fillAndSubmit();

    expect(await screen.findByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    expect(screen.queryByText(/caracteres|requisitos/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Pantalla de inicio")).not.toBeInTheDocument();
  });

  it("no enseña requisitos de contraseña: aquí no se dan pistas (SEC-01)", () => {
    renderWithRoutes();

    expect(screen.queryByRole("list", { name: /tu contraseña necesita/i })).not.toBeInTheDocument();
  });

  it("si se superan los intentos, pide esperar (SEC-02)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "x", code: "RATE_LIMITED" }) }));

    renderWithRoutes();
    fillAndSubmit();

    expect(await screen.findByText(/demasiados intentos/i)).toBeInTheDocument();
  });

  it("al iniciar sesión vacía la caché de datos: otro usuario en el mismo navegador nunca ve los del anterior", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "1", email: "ana@ejemplo.com" }) }));
    const client = createTestClient();
    client.setQueryData(["categories"], [{ id: "de-otro-usuario" }]);
    renderWithRoutes(client);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByText("Pantalla de inicio")).toBeInTheDocument());
    expect(client.getQueryData(["categories"])).toBeUndefined();
  });
});
