// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "@modules/accounts/ui/ProtectedRoute";
import "@shared/ui/i18n";

afterEach(() => vi.unstubAllGlobals());

describe("ProtectedRoute como ruta de diseño", () => {
  it("consulta la sesión una sola vez al navegar entre pantallas protegidas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "a@b.c" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<Link to="/perfil">ir a perfil</Link>} />
            <Route path="/perfil" element={<div>Perfil</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByText("ir a perfil"));

    expect(await screen.findByText("Perfil")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin sesión redirige a /login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: false }) }));

    render(
      <MemoryRouter initialEntries={["/inicio"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<div>Inicio</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login")).toBeInTheDocument();
  });
});

describe("sesión caducada (SEC-05)", () => {
  /** La sesión es válida al entrar; la llamada que hace la pantalla responde lo que se le pase. */
  function stubSessionThen(status: number) {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => Promise.resolve(url === "/api/accounts/session" ? { ok: true, status: 200, json: async () => ({ autenticado: true, email: "a@b.c" }) } : { ok: status < 400, status, json: async () => ({ error: "No autenticado" }) })),
    );
  }

  function renderWithAction(url: string) {
    render(
      <MemoryRouter initialEntries={["/perfil"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<button onClick={() => void fetch(url, { method: "PATCH" })}>Guardar</button>} />
          </Route>
          <Route path="/login" element={<div>Pantalla de entrar</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("si una llamada a la API responde 401, avisa de que la sesión ha caducado y lleva a entrar", async () => {
    stubSessionThen(401);
    renderWithAction("/api/accounts/profile");

    fireEvent.click(await screen.findByRole("button", { name: "Guardar" }));

    const dialog = await screen.findByRole("dialog", { name: /tu sesión ha caducado/i });
    fireEvent.click(screen.getByRole("button", { name: /volver a entrar/i }));
    expect(await screen.findByText("Pantalla de entrar")).toBeInTheDocument();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("otros errores no son una sesión caducada", async () => {
    stubSessionThen(500);
    renderWithAction("/api/accounts/profile");

    fireEvent.click(await screen.findByRole("button", { name: "Guardar" }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("un 401 del inicio de sesión (contraseña incorrecta) no es una sesión caducada", async () => {
    stubSessionThen(401);
    renderWithAction("/api/accounts/login");

    fireEvent.click(await screen.findByRole("button", { name: "Guardar" }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
