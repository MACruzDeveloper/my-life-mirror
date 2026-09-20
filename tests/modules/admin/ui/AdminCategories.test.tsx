// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { withClient } from "../../../helpers/queryClient";
import { AdminCategories } from "@modules/admin/ui/AdminCategories";

const CATALOGO = [
  { id: "k1", name: "Economía", description: "Tus finanzas.", isSensitiveData: false },
  { id: "k2", name: "Sexo", description: "Tu vida sexual.", isSensitiveData: true },
  { id: "k3", name: "Antigua", description: "Ya no se usa.", isSensitiveData: false, retiredAt: "2026-09-01T10:00:00.000Z" },
];

function stubFetch(extra: (url: string, init?: RequestInit) => unknown = () => undefined, listado: unknown = CATALOGO, listadoOk = true) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    const personalizada = extra(url, init);
    if (personalizada) return Promise.resolve(personalizada);
    if (url === "/api/admin/categories" && (!init || !init.method)) {
      return Promise.resolve({ ok: listadoOk, status: listadoOk ? 200 : 403, json: async () => listado });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminCategories (ADM-02)", () => {
  it("lista el catálogo marcando las sensibles y las retiradas", async () => {
    stubFetch();
    render(withClient(<AdminCategories />));

    expect(await screen.findByText("Economía")).toBeInTheDocument();
    const filaSexo = screen.getByText("Sexo").closest("tr")!;
    expect(within(filaSexo).getByText(/sensible/i)).toBeInTheDocument();
    const filaAntigua = screen.getByText("Antigua").closest("tr")!;
    expect(within(filaAntigua).getByText(/retirada/i)).toBeInTheDocument();
    expect(within(filaAntigua).queryByRole("button", { name: /retirar/i })).not.toBeInTheDocument();
  });

  it("añade una categoría con nombre, descripción y marca de sensible, y recarga la lista", async () => {
    const fetchMock = stubFetch((url, init) =>
      url === "/api/admin/categories" && init?.method === "POST" ? { ok: true, status: 201, json: async () => ({}) } : undefined,
    );
    render(withClient(<AdminCategories />));
    await screen.findByText("Economía");

    fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: "Creatividad" } });
    fireEvent.change(screen.getByLabelText(/^descripción/i), { target: { value: "Arte y hobbies." } });
    fireEvent.click(screen.getByRole("checkbox", { name: /datos sensibles/i }));
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(JSON.parse(post?.[1]?.body as string)).toEqual({ name: "Creatividad", description: "Arte y hobbies.", isSensitiveData: true });
    });
    await waitFor(() => expect(fetchMock.mock.calls.filter(([u, i]) => u === "/api/admin/categories" && !i?.method).length).toBe(2));
  });

  it("muestra el error del servidor al añadir (p. ej. nombre duplicado)", async () => {
    stubFetch((url, init) =>
      url === "/api/admin/categories" && init?.method === "POST"
        ? { ok: false, status: 409, json: async () => ({ error: "A category with that name already exists" }) }
        : undefined,
    );
    render(withClient(<AdminCategories />));
    await screen.findByText("Economía");

    fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: "Economía" } });
    fireEvent.change(screen.getByLabelText(/^descripción/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it("retirar pide confirmación y solo entonces llama a la API", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminCategories />));
    await screen.findByText("Economía");

    fireEvent.click(within(screen.getByText("Economía").closest("tr")!).getByRole("button", { name: /retirar/i }));
    expect(fetchMock.mock.calls.some(([u]) => u === "/api/admin/categories/retire")).toBe(false);
    expect(within(screen.getByRole("dialog")).getByText(/las puntuaciones ya guardadas se conservan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar retirada/i }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find(([u]) => u === "/api/admin/categories/retire");
      expect(JSON.parse(llamada?.[1]?.body as string)).toEqual({ categoryId: "k1" });
    });
  });

  it("cancelar la confirmación no retira nada", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminCategories />));
    await screen.findByText("Economía");

    fireEvent.click(within(screen.getByText("Economía").closest("tr")!).getByRole("button", { name: /retirar/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([u]) => u === "/api/admin/categories/retire")).toBe(false);
  });

  it("con un 403 no muestra datos", async () => {
    stubFetch(() => undefined, { error: "Forbidden" }, false);
    render(withClient(<AdminCategories />));

    expect(await screen.findByText(/no tienes permiso/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
