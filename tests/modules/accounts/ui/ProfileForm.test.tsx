// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ProfileForm } from "@modules/accounts/ui/ProfileForm";
import { SessionProvider } from "@shared/ui/context/SessionContext";
import type { QueryClient } from "@tanstack/react-query";
import { createTestClient, withClient } from "../../../helpers/queryClient";

// ProfileForm vive dentro de SessionProvider en la app real (ProtectedRoute
// lo instala) y ahora llama a refresh() al guardar — así que además de
// /api/profile, cada test también ve la llamada a /api/sesion que dispara
// el propio SessionProvider al montar. Se mockea por URL en vez de por
// orden de llamada porque ambas peticiones salen en el mismo montaje.
function stubFetch(profile: unknown) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/accounts/session") {
      return Promise.resolve({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) });
    }
    // Como el servidor de verdad: al guardar devuelve el perfil ya actualizado.
    if (init?.method === "POST") return Promise.resolve({ ok: true, json: async () => ({ ...(profile as object), ...JSON.parse(init.body as string) }) });
    return Promise.resolve({ ok: true, json: async () => profile });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderProfileForm(client: QueryClient = createTestClient()) {
  return render(
    withClient(
      <SessionProvider>
        <ProfileForm />
      </SessionProvider>,
      client,
    ),
  );
}

describe("ProfileForm (RF-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("precarga los datos existentes al abrir la pantalla", async () => {
    stubFetch({ name: "Ana", birthDate: "1996-05-20", gender: "woman", timeZone: "Europe/Madrid" });

    renderProfileForm();

    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toHaveValue("1996-05-20");
  });

  it("empieza con los campos vacíos si el usuario no tiene perfil todavía (el nombre llega del registro)", async () => {
    stubFetch(null);

    renderProfileForm();

    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/nombre/i)).toHaveValue("");
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toHaveValue("");
  });

  it("guarda el perfil, muestra confirmación y refresca la sesión (para que el Header se entere)", async () => {
    const fetchMock = stubFetch({ name: "Ana" });

    renderProfileForm();
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));

    const sessionCallsBefore = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/session").length;

    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), { target: { value: "1996-05-20" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/perfil guardado/i)).toBeInTheDocument());

    const saveCall = fetchMock.mock.calls.find(([url, init]) => url === "/api/accounts/profile" && init?.method === "POST");
    expect(saveCall).toBeDefined();
    const body = JSON.parse(saveCall?.[1]?.body as string);
    expect(body.name).toBe("Ana");
    expect(body.birthDate).toBe("1996-05-20");

    await waitFor(() => {
      const sessionCallsAfter = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/session").length;
      expect(sessionCallsAfter).toBeGreaterThan(sessionCallsBefore);
    });
  });

  it("muestra el error que devuelve el servidor al guardar", async () => {
    let fails = false;
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/accounts/session") {
        return Promise.resolve({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) });
      }
      if (fails) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "La fecha no es válida" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ name: "Ana" }) });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderProfileForm();
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));

    fails = true;
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/la fecha no es válida/i)).toBeInTheDocument());
  });

  it("al volver a la pantalla no repite la llamada, y lo guardado queda en la caché", async () => {
    const fetchMock = stubFetch({ name: "Ana" });
    const client = createTestClient();
    const first = renderProfileForm(client);
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Ana María" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText(/perfil guardado|guardado/i)).toBeInTheDocument());
    first.unmount();

    renderProfileForm(client);

    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana María");
    expect(fetchMock.mock.calls.filter(([u, i]) => u === "/api/accounts/profile" && !i?.method)).toHaveLength(1);
  });

  it("RF-26: guarda el avatar elegido junto al resto, y la caché conserva lo que el formulario no toca (la elección de IA)", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/accounts/session") return Promise.resolve({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) });
      if (init?.method === "POST") return Promise.resolve({ ok: true, json: async () => ({ userId: "u1", name: "Ana", timeZone: "Europe/Madrid", avatarKey: "longBraids", aiIdeasEnabled: true }) });
      return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", timeZone: "Europe/Madrid", aiIdeasEnabled: true }) });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestClient();
    render(
      withClient(
        <SessionProvider>
          <ProfileForm avatarKeys={["roundGlasses", "longBraids"]} />
        </SessionProvider>,
        client,
      ),
    );

    fireEvent.click(await screen.findByRole("radio", { name: /dos trenzas largas/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(client.getQueryData(["profile"])).toMatchObject({ avatarKey: "longBraids", aiIdeasEnabled: true }));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toMatchObject({ name: "Ana", avatarKey: "longBraids" });
  });

  it("RF-46: precarga profesión y aficiones, y guarda lo que se elige; la profesión es un desplegable, no texto libre", async () => {
    const fetchMock = stubFetch({ name: "Ana", occupation: "docencia", hobbies: ["lectura"] });
    renderProfileForm();
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));

    expect(screen.getByRole("combobox", { name: /profesión/i })).toHaveTextContent("Docencia y educación");
    const hobbies = within(screen.getByRole("group", { name: /aficiones/i }));
    expect(hobbies.getByRole("button", { name: "Lectura" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /profesión/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Desarrollo web" }));
    fireEvent.click(hobbies.getByRole("button", { name: "Montaña" }));
    fireEvent.click(hobbies.getByRole("button", { name: "Lectura" }));
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/perfil guardado/i)).toBeInTheDocument());
    const [, init] = fetchMock.mock.calls.find(([url, request]) => url === "/api/accounts/profile" && request?.method === "POST")!;
    expect(JSON.parse(init!.body as string)).toMatchObject({ occupation: "desarrolloWeb", hobbies: ["montana"] });
  });

  it("RF-46: sin profesión ni aficiones, se envían vacías (así se pueden quitar)", async () => {
    const fetchMock = stubFetch({ name: "Ana" });
    renderProfileForm();
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/perfil guardado/i)).toBeInTheDocument());
    const [, init] = fetchMock.mock.calls.find(([url, request]) => url === "/api/accounts/profile" && request?.method === "POST")!;
    expect(JSON.parse(init!.body as string)).toMatchObject({ occupation: null, hobbies: [] });
  });
});
