// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { DataPrivacyPage } from "@modules/accounts/ui/DataPrivacyPage";
import { SessionProvider } from "@shared/ui/context/SessionContext";
import { createTestClient, withClient } from "../../../helpers/queryClient";
import type { QueryClient } from "@tanstack/react-query";
import { categoryLabelsFixture } from "../../../helpers/categoryLabels";

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

function deleteCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/delete-account");
}

function openDialog() {
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

    const dialog = openDialog();

    expect(within(dialog).getByText(/no se puede deshacer/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /eliminar definitivamente/i })).toBeDisabled();
    // La página sí lee sus datos (p. ej. las experiencias compartidas, RF-43); lo que no hace es eliminar.
    expect(deleteCalls(fetchMock)).toHaveLength(0);
  });

  it("con la contraseña correcta elimina la cuenta, vacía la caché y lleva a la página pública", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestClient();
    client.setQueryData(["categories"], [{ id: "c1" }]);
    renderPage(client);

    const dialog = openDialog();
    fireEvent.change(within(dialog).getByLabelText(/contraseña/i), { target: { value: "12345678" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /eliminar definitivamente/i }));

    await waitFor(() => expect(screen.getByText("Página pública")).toBeInTheDocument());
    const [[, init]] = deleteCalls(fetchMock);
    expect(JSON.parse(init.body)).toEqual({ password: "12345678" });
    expect(client.getQueryData(["categories"])).toBeUndefined();
  });

  it("con una contraseña incorrecta lo dice, sigue en la pantalla y deja reintentar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: "Contraseña incorrecta" }) }));
    renderPage();

    const dialog = openDialog();
    fireEvent.change(within(dialog).getByLabelText(/contraseña/i), { target: { value: "mal" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /eliminar definitivamente/i }));

    expect(await within(dialog).findByText(/contraseña incorrecta/i)).toBeInTheDocument();
    expect(screen.queryByText("Página pública")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /eliminar definitivamente/i })).toBeEnabled();
  });

  it("si es el único administrador, explica por qué no puede y qué hacer (no un error genérico)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Cannot delete the only administrator account", code: "CONFLICT" }) }));
    renderPage();

    const dialog = openDialog();
    fireEvent.change(within(dialog).getByLabelText(/contraseña/i), { target: { value: "12345678" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /eliminar definitivamente/i }));

    expect(await within(dialog).findByText(/único administrador/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/crees otro administrador/i)).toBeInTheDocument();
    expect(screen.queryByText("Página pública")).not.toBeInTheDocument();
  });

  it("cancelar cierra el cuadro sin llamar al servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(deleteCalls(fetchMock)).toHaveLength(0);
  });

  describe("ideas personalizadas con IA (RF-40)", () => {
    function stubAi({ available, enabled }: { available: boolean; enabled: boolean }) {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (url === "/api/accounts/session") return Promise.resolve({ ok: true, json: async () => ({ autenticado: true, email: "ana@ejemplo.com", aiIdeasAvailable: available }) });
        if (url === "/api/accounts/profile") return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiIdeasEnabled: enabled }) });
        if (url === "/api/accounts/ai-ideas") {
          const { enabled: next } = JSON.parse(init?.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiIdeasEnabled: next }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    function renderWithSession() {
      return render(
        withClient(
          <MemoryRouter initialEntries={["/perfil/datos"]}>
            <SessionProvider>
              <DataPrivacyPage />
            </SessionProvider>
          </MemoryRouter>,
        ),
      );
    }

    it("con la función disponible, se ofrece desactivada y explica qué se envía y qué nunca", async () => {
      stubAi({ available: true, enabled: false });
      renderWithSession();

      const toggle = await screen.findByRole("switch", { name: /ideas personalizadas con ia/i });
      expect(toggle).not.toBeChecked();
      expect(screen.getByText(/nunca se envían tu nombre, tu email, tus experiencias privadas ni las categorías sensibles/i)).toBeInTheDocument();
    });

    it("activarla y desactivarla lo guarda en el servidor", async () => {
      const fetchMock = stubAi({ available: true, enabled: false });
      renderWithSession();

      fireEvent.click(await screen.findByRole("switch", { name: /ideas personalizadas con ia/i }));
      await waitFor(() => expect(screen.getByRole("switch", { name: /ideas personalizadas con ia/i })).toBeChecked());
      fireEvent.click(screen.getByRole("switch", { name: /ideas personalizadas con ia/i }));
      await waitFor(() => expect(screen.getByRole("switch", { name: /ideas personalizadas con ia/i })).not.toBeChecked());

      const bodies = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/ai-ideas").map(([, init]) => JSON.parse(init?.body as string));
      expect(bodies).toEqual([{ enabled: true }, { enabled: false }]);
    });

    it("sin la función disponible (producción sin proveedor) no se ofrece", async () => {
      stubAi({ available: false, enabled: false });
      renderWithSession();

      await screen.findByRole("button", { name: /descargar mis datos/i });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole("switch", { name: /ideas personalizadas con ia/i })).not.toBeInTheDocument();
    });
  });

  describe("sugerencias de la IA a partir de tus experiencias (RF-45)", () => {
    function stubSuggestions({ available, enabled }: { available: boolean; enabled: boolean }) {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (url === "/api/accounts/session") return Promise.resolve({ ok: true, json: async () => ({ autenticado: true, email: "ana@ejemplo.com", aiIdeasAvailable: available }) });
        if (url === "/api/accounts/profile") return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiSuggestionsEnabled: enabled }) });
        if (url === "/api/accounts/ai-suggestions") {
          const { enabled: next } = JSON.parse(init?.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiSuggestionsEnabled: next }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    function renderWithSession() {
      return render(
        withClient(
          <MemoryRouter initialEntries={["/perfil/datos"]}>
            <SessionProvider>
              <DataPrivacyPage />
            </SessionProvider>
          </MemoryRouter>,
        ),
      );
    }

    it("se ofrece desactivada, aparte de la de ideas, y explica qué se envía, qué se quita y qué nunca", async () => {
      stubSuggestions({ available: true, enabled: false });
      renderWithSession();

      const toggle = await screen.findByRole("switch", { name: /sugerencias de la ia a partir de tus experiencias/i });
      expect(toggle).not.toBeChecked();
      expect(screen.getByText(/solo la experiencia que tú le pidas analizar/i)).toBeInTheDocument();
      expect(screen.getByText(/quitamos emails, teléfonos, enlaces y números largos/i)).toBeInTheDocument();
      expect(screen.getByText(/nunca se envían las categorías sensibles/i)).toBeInTheDocument();
    });

    it("activarla y desactivarla lo guarda en el servidor", async () => {
      const fetchMock = stubSuggestions({ available: true, enabled: false });
      renderWithSession();
      const name = /sugerencias de la ia a partir de tus experiencias/i;

      fireEvent.click(await screen.findByRole("switch", { name }));
      await waitFor(() => expect(screen.getByRole("switch", { name })).toBeChecked());
      fireEvent.click(screen.getByRole("switch", { name }));
      await waitFor(() => expect(screen.getByRole("switch", { name })).not.toBeChecked());

      const bodies = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/ai-suggestions").map(([, init]) => JSON.parse(init?.body as string));
      expect(bodies).toEqual([{ enabled: true }, { enabled: false }]);
    });

    it("sin la función disponible no se ofrece", async () => {
      stubSuggestions({ available: false, enabled: false });
      renderWithSession();

      await screen.findByRole("button", { name: /descargar mis datos/i });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole("switch", { name: /sugerencias de la ia/i })).not.toBeInTheDocument();
    });
  });

  describe("experiencias compartidas (RF-43)", () => {
    function stubShared(experiences: unknown[]) {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (url === "/api/categories/diary" && init?.method === "PATCH") {
          const { id, shared } = JSON.parse(init.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ ...(experiences as { id: string }[]).find((experience) => experience.id === id), shared }) });
        }
        if (url === "/api/categories/diary") return Promise.resolve({ ok: true, json: async () => experiences });
        if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => [{ id: "c1", catalogId: "k-economia", status: "active", isSensitiveData: false }] });
        if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    it("lista las compartidas, con su categoría, y 'Dejar de compartir' las vuelve privadas", async () => {
      const fetchMock = stubShared([
        { id: "e1", categoryId: "c1", text: "Apunto los gastos cada domingo", createdAt: "2026-10-05T10:00:00.000Z", shared: true },
        { id: "e2", categoryId: "c1", text: "Esta es privada", createdAt: "2026-10-04T10:00:00.000Z", shared: false },
      ]);
      renderPage();

      const section = (await screen.findByRole("heading", { name: "Experiencias compartidas" })).closest("section") as HTMLElement;
      const item = (await within(section).findByText("Apunto los gastos cada domingo")).closest("li") as HTMLElement;
      expect(await within(item).findByText("Economía")).toBeInTheDocument();
      expect(within(section).queryByText("Esta es privada")).not.toBeInTheDocument();

      fireEvent.click(within(item).getByRole("button", { name: "Dejar de compartir" }));

      expect(await within(section).findByText("No tienes ninguna experiencia compartida.")).toBeInTheDocument();
      const patches = fetchMock.mock.calls.filter(([url, init]) => url === "/api/categories/diary" && init?.method === "PATCH");
      expect(patches.map(([, init]) => JSON.parse(init?.body as string))).toEqual([{ id: "e1", shared: false }]);
    });
  });
});
