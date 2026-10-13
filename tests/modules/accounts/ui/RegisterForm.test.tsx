// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { RegisterForm } from "@modules/accounts/ui/RegisterForm";
import { createTestClient, withClient } from "../../../helpers/queryClient";

function fillAndSubmit(password = "Bici-Azul-Lluvia-47", name = "Ana") {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));
}

function renderForm() {
  return render(
    withClient(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    ),
  );
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
      withClient(<MemoryRouter initialEntries={["/registro"]}>
        <Routes>
          <Route path="/registro" element={<RegisterForm />} />
          <Route path="/inicio" element={<div>Página de inicio</div>} />
        </Routes>
      </MemoryRouter>),
    );
    fillAndSubmit();

    await waitFor(() => expect(screen.getByText("Página de inicio")).toBeInTheDocument());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ name: "Ana", email: "ana@ejemplo.com", password: "Bici-Azul-Lluvia-47" });
  });

  it("si la cuenta se crea pero la sesión no, confirma y ofrece iniciar sesión a mano", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "1", email: "ana@ejemplo.com", sesionIniciada: false }) }),
    );

    render(
      withClient(<MemoryRouter>
        <RegisterForm />
      </MemoryRouter>),
    );
    fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/cuenta creada/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
  });

  describe("contraseña fuerte (SEC-01)", () => {
    it("los requisitos están plegados: se ven al pulsar el botón de información y se vuelven a ocultar", () => {
      renderForm();
      expect(screen.queryByRole("list", { name: /tu contraseña necesita/i })).not.toBeInTheDocument();

      const infoButton = screen.getByRole("button", { name: "Requisitos de la contraseña" });
      expect(infoButton).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(infoButton);

      const requirements = within(screen.getByRole("list", { name: /tu contraseña necesita/i }));
      expect(requirements.getAllByRole("listitem")).toHaveLength(5);
      expect(requirements.getByText(/entre 12 y 72 caracteres/i)).toBeInTheDocument();
      expect(requirements.getByText(/un símbolo/i)).toBeInTheDocument();
      expect(infoButton).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(infoButton);
      expect(screen.queryByRole("list", { name: /tu contraseña necesita/i })).not.toBeInTheDocument();
    });

    it("abiertos, marca cada requisito según se va cumpliendo", () => {
      renderForm();
      fireEvent.click(screen.getByRole("button", { name: "Requisitos de la contraseña" }));

      fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: "bici" } });

      expect(screen.getByText(/una letra minúscula/i).closest("li")).toHaveAttribute("data-state", "met");
      expect(screen.getByText(/una letra mayúscula/i).closest("li")).toHaveAttribute("data-state", "pending");
    });

    it("con 'Test1234!' no envía nada, abre los requisitos y dice qué falla, también lo previsible", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      renderForm();

      fillAndSubmit("Test1234!");

      expect(await screen.findByText(/no cumple los requisitos/i)).toBeInTheDocument();
      expect(screen.getByText(/entre 12 y 72 caracteres/i).closest("li")).toHaveAttribute("data-state", "missing");
      expect(screen.getByText(/secuencias ni repeticiones/i)).toBeInTheDocument();
      expect(screen.getByText(/contraseña muy común/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("avisa si la contraseña contiene el nombre de quien se registra", async () => {
      vi.stubGlobal("fetch", vi.fn());
      renderForm();

      fillAndSubmit("Marina-Lluvia-2026!", "Marina");

      expect(await screen.findByText(/tu nombre ni tu email/i)).toBeInTheDocument();
    });

    it("si el servidor la rechaza igualmente, enseña los requisitos que él indica", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "x", code: "WEAK_PASSWORD", rules: ["common"] }) }));
      renderForm();

      fillAndSubmit();

      expect(await screen.findByText(/contraseña muy común/i)).toBeInTheDocument();
    });

    it("deja ver lo que se escribe, para no equivocarse con una contraseña larga", () => {
      renderForm();
      const field = screen.getByLabelText(/^contraseña/i);

      fireEvent.click(screen.getByRole("button", { name: /mostrar la contraseña/i }));

      expect(field).toHaveAttribute("type", "text");
    });
  });

  it("si el email ya tiene cuenta, el mensaje no lo afirma (SEC-01)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "No se ha podido crear la cuenta con este email", code: "EMAIL_NOT_ACCEPTED" }) }));
    renderForm();

    fillAndSubmit();

    expect(await screen.findByText(/no se ha podido crear la cuenta con este email/i)).toBeInTheDocument();
    expect(screen.queryByText(/ya existe/i)).not.toBeInTheDocument();
  });

  it("si se superan los intentos, pide esperar (SEC-02)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "x", code: "RATE_LIMITED" }) }));
    renderForm();

    fillAndSubmit();

    expect(await screen.findByText(/demasiados intentos/i)).toBeInTheDocument();
  });

  it("al registrarse con sesión iniciada vacía la caché de datos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "1", email: "ana@ejemplo.com", sesionIniciada: true }) }));
    const client = createTestClient();
    client.setQueryData(["categories"], [{ id: "de-otro-usuario" }]);

    render(
      withClient(
        <MemoryRouter initialEntries={["/registro"]}>
          <Routes>
            <Route path="/registro" element={<RegisterForm />} />
            <Route path="/inicio" element={<div>Página de inicio</div>} />
          </Routes>
        </MemoryRouter>,
        client,
      ),
    );
    fillAndSubmit();

    await waitFor(() => expect(screen.getByText("Página de inicio")).toBeInTheDocument());
    expect(client.getQueryData(["categories"])).toBeUndefined();
  });
});
