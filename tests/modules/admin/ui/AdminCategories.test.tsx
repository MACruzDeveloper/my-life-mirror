// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { withClient } from "../../../helpers/queryClient";
import { AdminCategories } from "@modules/admin/ui/AdminCategories";

const text = (name: string, description = "d") => ({ name, description });

const CATALOG = [
  { id: "k1", key: "economia", translations: { es: text("Finanzas", "Tus finanzas."), en: text("Finances", "Your finances.") }, isSensitiveData: false },
  { id: "k2", key: "sexo", translations: { es: text("Sexo", "Tu vida sexual."), en: text("Sex", "Your sex life.") }, isSensitiveData: true },
  { id: "k3", translations: { es: text("Antigua", "Ya no se usa.") }, isSensitiveData: false, retiredAt: "2026-09-01T10:00:00.000Z" },
];

function stubFetch(custom: (url: string, init?: RequestInit) => unknown = () => undefined, catalog: unknown = CATALOG, catalogOk = true) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    const customResponse = custom(url, init);
    if (customResponse) return Promise.resolve(customResponse);
    if (url === "/api/admin/categories" && (!init || !init.method)) {
      return Promise.resolve({ ok: catalogOk, status: catalogOk ? 200 : 403, json: async () => catalog });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fillForm(values: { esName?: string; esDescription?: string; enName?: string; enDescription?: string }) {
  const fields: [RegExp, string | undefined][] = [
    [/nombre \(español\)/i, values.esName],
    [/descripción \(español\)/i, values.esDescription],
    [/nombre \(inglés\)/i, values.enName],
    [/descripción \(inglés\)/i, values.enDescription],
  ];
  for (const [label, value] of fields) {
    if (value !== undefined) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}

function rowOf(name: string) {
  return screen.getByText(name).closest("tr")!;
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminCategories (ADM-02)", () => {
  it("lista el catálogo con una columna de nombre por idioma, marcando las sensibles y las retiradas", async () => {
    stubFetch();
    render(withClient(<AdminCategories />));

    await screen.findByText("Finanzas");
    const finances = rowOf("Finanzas");
    expect(within(finances).getByText("Finances")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre (español)" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre (inglés)" })).toBeInTheDocument();
    expect(within(rowOf("Sexo")).getByText(/sensible/i)).toBeInTheDocument();
    const retired = rowOf("Antigua");
    expect(within(retired).getByText(/retirada/i)).toBeInTheDocument();
    // Sin traducción en ese idioma: se indica, no se inventa.
    expect(within(retired).getByText("—")).toBeInTheDocument();
    expect(within(retired).queryByRole("button", { name: /retirar/i })).not.toBeInTheDocument();
  });

  it("añade una categoría con su texto en cada idioma y la marca de sensible, y recarga la lista", async () => {
    const fetchMock = stubFetch((url, init) =>
      url === "/api/admin/categories" && init?.method === "POST" ? { ok: true, status: 201, json: async () => ({}) } : undefined,
    );
    render(withClient(<AdminCategories />));
    await screen.findByText("Finanzas");

    fillForm({ esName: "Creatividad", esDescription: "Arte y hobbies.", enName: "Creativity", enDescription: "Art and hobbies." });
    fireEvent.click(screen.getByRole("checkbox", { name: /datos sensibles/i }));
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(JSON.parse(post?.[1]?.body as string)).toEqual({
        translations: { es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } },
        isSensitiveData: true,
      });
    });
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/admin/categories" && !init?.method).length).toBe(2));
  });

  it("el botón de añadir sigue desactivado hasta que están el nombre y la descripción en todos los idiomas", async () => {
    stubFetch();
    render(withClient(<AdminCategories />));
    await screen.findByText("Finanzas");
    const addButton = screen.getByRole("button", { name: /añadir categoría/i });

    fillForm({ esName: "Creatividad", esDescription: "Arte." });
    expect(addButton).toBeDisabled();

    fillForm({ enName: "Creativity", enDescription: "Art." });
    expect(addButton).toBeEnabled();
  });

  it("muestra el error del servidor al añadir (p. ej. nombre duplicado)", async () => {
    stubFetch((url, init) =>
      url === "/api/admin/categories" && init?.method === "POST"
        ? { ok: false, status: 409, json: async () => ({ error: "A category with that name already exists" }) }
        : undefined,
    );
    render(withClient(<AdminCategories />));
    await screen.findByText("Finanzas");

    fillForm({ esName: "Finanzas", esDescription: "x", enName: "Money", enDescription: "x" });
    fireEvent.click(screen.getByRole("button", { name: /añadir categoría/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it("retirar pide confirmación y solo entonces llama a la API", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminCategories />));
    await screen.findByText("Finanzas");

    fireEvent.click(within(rowOf("Finanzas")).getByRole("button", { name: /retirar/i }));
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/admin/categories/retire")).toBe(false);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/finanzas/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/las puntuaciones ya guardadas se conservan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar retirada/i }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) => url === "/api/admin/categories/retire");
      expect(JSON.parse(call?.[1]?.body as string)).toEqual({ categoryId: "k1" });
    });
  });

  it("cancelar la confirmación no retira nada", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminCategories />));
    await screen.findByText("Finanzas");

    fireEvent.click(within(rowOf("Finanzas")).getByRole("button", { name: /retirar/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/admin/categories/retire")).toBe(false);
  });

  it("con un 403 no muestra datos", async () => {
    stubFetch(() => undefined, { error: "Forbidden" }, false);
    render(withClient(<AdminCategories />));

    expect(await screen.findByText(/no tienes permiso/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
