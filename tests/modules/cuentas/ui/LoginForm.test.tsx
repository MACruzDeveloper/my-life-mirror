// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { LoginForm } from "@modules/cuentas/ui/LoginForm";
import type { QueryClient } from "@tanstack/react-query";
import { createTestClient, withClient } from "../../../helpers/queryClient";

function completarYEnviar() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "12345678" } });
  fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

function renderConRutas(client: QueryClient = createTestClient()) {
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
    renderConRutas();

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

    renderConRutas();
    completarYEnviar();

    await waitFor(() => {
      expect(screen.getByText("Pantalla de inicio")).toBeInTheDocument();
    });
  });

  it("muestra el mensaje de error que devuelve el servidor, sin navegar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email o contraseña incorrectos" }),
      }),
    );

    renderConRutas();
    completarYEnviar();

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  it("al iniciar sesión vacía la caché de datos: otro usuario en el mismo navegador nunca ve los del anterior", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "1", email: "ana@ejemplo.com" }) }));
    const client = createTestClient();
    client.setQueryData(["categories"], [{ id: "de-otro-usuario" }]);
    renderConRutas(client);

    completarYEnviar();

    await waitFor(() => expect(screen.getByText("Pantalla de inicio")).toBeInTheDocument());
    expect(client.getQueryData(["categories"])).toBeUndefined();
  });
});
