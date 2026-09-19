// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ProfileForm } from "@modules/cuentas/ui/ProfileForm";
import { SessionProvider } from "@shared/ui/context/SessionContext";

// ProfileForm vive dentro de SessionProvider en la app real (ProtectedRoute
// lo instala) y ahora llama a refresh() al guardar — así que además de
// /api/profile, cada test también ve la llamada a /api/sesion que dispara
// el propio SessionProvider al montar. Se mockea por URL en vez de por
// orden de llamada porque ambas peticiones salen en el mismo montaje.
function stubFetch(perfil: unknown) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/accounts/session") {
      return Promise.resolve({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) });
    }
    void init;
    return Promise.resolve({ ok: true, json: async () => perfil });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderProfileForm() {
  return render(
    <SessionProvider>
      <ProfileForm />
    </SessionProvider>,
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

    const llamadasSesionAntes = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/session").length;

    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), { target: { value: "1996-05-20" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/perfil guardado/i)).toBeInTheDocument());

    const llamadaGuardar = fetchMock.mock.calls.find(([url, init]) => url === "/api/accounts/profile" && init?.method === "POST");
    expect(llamadaGuardar).toBeDefined();
    const cuerpo = JSON.parse(llamadaGuardar?.[1]?.body as string);
    expect(cuerpo.name).toBe("Ana");
    expect(cuerpo.birthDate).toBe("1996-05-20");

    await waitFor(() => {
      const llamadasSesionDespues = fetchMock.mock.calls.filter(([url]) => url === "/api/accounts/session").length;
      expect(llamadasSesionDespues).toBeGreaterThan(llamadasSesionAntes);
    });
  });

  it("muestra el error que devuelve el servidor al guardar", async () => {
    let falla = false;
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/accounts/session") {
        return Promise.resolve({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) });
      }
      if (falla) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "La fecha no es válida" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ name: "Ana" }) });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderProfileForm();
    await waitFor(() => expect(screen.getByLabelText(/nombre/i)).toHaveValue("Ana"));

    falla = true;
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText(/la fecha no es válida/i)).toBeInTheDocument());
  });
});
