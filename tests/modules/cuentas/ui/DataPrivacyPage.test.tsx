// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { DataPrivacyPage } from "@modules/cuentas/ui/DataPrivacyPage";
import { createTestClient, withClient } from "../../../helpers/queryClient";
import type { QueryClient } from "@tanstack/react-query";

function renderPage(client: QueryClient = createTestClient()) {
  return render(
    withClient(
      <MemoryRouter initialEntries={["/perfil/datos"]}>
        <Routes>
          <Route path="/perfil/datos" element={<DataPrivacyPage />} />
          <Route path="/" element={<div>Página pública</div>} />
        </Routes>
      </MemoryRouter>,
      client,
    ),
  );
}

function abrirDialogo() {
  fireEvent.click(screen.getByRole("button", { name: /eliminar mi cuenta/i }));
  return screen.getByRole("dialog");
}

describe("DataPrivacyPage (RF-05)", () => {
  const click = vi.fn();

  beforeEach(() => {
    click.mockReset();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click);
    URL.createObjectURL = vi.fn(() => "blob:datos");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("descarga los datos del usuario como archivo al pulsar exportar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["{}"], { type: "application/json" }) });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /descargar mis datos/i }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/accounts/export-data");
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("si la exportación falla lo dice, sin descargar nada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /descargar mis datos/i }));

    expect(await screen.findByText(/no se pudieron exportar tus datos/i)).toBeInTheDocument();
    expect(click).not.toHaveBeenCalled();
  });

  it("eliminar pide confirmación: avisa de que es irreversible y no llama al servidor hasta confirmar con la contraseña", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const dialogo = abrirDialogo();

    expect(within(dialogo).getByText(/no se puede deshacer/i)).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: /eliminar definitivamente/i })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con la contraseña correcta elimina la cuenta, vacía la caché y lleva a la página pública", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestClient();
    client.setQueryData(["categories"], [{ id: "c1" }]);
    renderPage(client);

    const dialogo = abrirDialogo();
    fireEvent.change(within(dialogo).getByLabelText(/contraseña/i), { target: { value: "12345678" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: /eliminar definitivamente/i }));

    await waitFor(() => expect(screen.getByText("Página pública")).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/accounts/delete-account");
    expect(JSON.parse(init.body)).toEqual({ password: "12345678" });
    expect(client.getQueryData(["categories"])).toBeUndefined();
  });

  it("con una contraseña incorrecta lo dice, sigue en la pantalla y deja reintentar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: "Contraseña incorrecta" }) }));
    renderPage();

    const dialogo = abrirDialogo();
    fireEvent.change(within(dialogo).getByLabelText(/contraseña/i), { target: { value: "mal" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: /eliminar definitivamente/i }));

    expect(await within(dialogo).findByText(/contraseña incorrecta/i)).toBeInTheDocument();
    expect(screen.queryByText("Página pública")).not.toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: /eliminar definitivamente/i })).toBeEnabled();
  });

  it("si es el único administrador, explica por qué no puede y qué hacer (no un error genérico)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Cannot delete the only administrator account", code: "CONFLICT" }) }));
    renderPage();

    const dialogo = abrirDialogo();
    fireEvent.change(within(dialogo).getByLabelText(/contraseña/i), { target: { value: "12345678" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: /eliminar definitivamente/i }));

    expect(await within(dialogo).findByText(/único administrador/i)).toBeInTheDocument();
    expect(within(dialogo).getByText(/crees otro administrador/i)).toBeInTheDocument();
    expect(screen.queryByText("Página pública")).not.toBeInTheDocument();
  });

  it("cancelar cierra el cuadro sin llamar al servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const dialogo = abrirDialogo();
    fireEvent.click(within(dialogo).getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
