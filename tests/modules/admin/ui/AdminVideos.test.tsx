// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { withClient } from "../../../helpers/queryClient";
import { AdminVideos } from "@modules/admin/ui/AdminVideos";

const LABELS = [
  { catalogId: "k-dep", key: "deporte", translations: { es: { name: "Deporte", description: "d" } } },
  { catalogId: "k-ave", key: "aventura", translations: { es: { name: "Aventura", description: "d" } } },
  { catalogId: "k-new", translations: { es: { name: "Creada a mano", description: "d" } } },
];
const video = (id: string, categoryKey: string, title: string, locale = "en") => ({ id, categoryKey, locale, youtubeId: `${id}AAAAAAAAAA`.slice(0, 11), title });
const VIDEOS = [video("v1", "deporte", "The brain-changing benefits of exercise"), video("v2", "aventura", "Try something new for 30 days")];

function stubFetch({ videos = VIDEOS, writeResponse = { ok: true, status: 200, body: {} as unknown } } = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method) return Promise.resolve({ ok: writeResponse.ok, status: writeResponse.status, json: async () => writeResponse.body });
    const data: Record<string, unknown> = { "/api/admin/videos": videos, "/api/categories/translations": LABELS };
    return Promise.resolve({ ok: true, status: 200, json: async () => data[url] ?? [] });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function choose(label: RegExp, option: string) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

const rowOf = async (title: string) => (await screen.findByText(title)).closest("tr")!;

describe("AdminVideos (ADM-04)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lista los vídeos con su categoría, idioma, título y el enlace a YouTube", async () => {
    stubFetch();
    render(withClient(<AdminVideos />));

    const row = await rowOf("The brain-changing benefits of exercise");
    expect(row).toHaveTextContent(/Deporte[\s\S]*Inglés/);
    expect(within(row).getByRole("link", { name: /ver en youtube/i })).toHaveAttribute("href", "https://www.youtube.com/watch?v=v1AAAAAAAAA");
  });

  it("añade un vídeo eligiendo categoría (solo las del catálogo con clave) e idioma, con el enlace de YouTube", async () => {
    const fetchMock = stubFetch({ writeResponse: { ok: true, status: 201, body: {} } });
    render(withClient(<AdminVideos />));
    await rowOf("The brain-changing benefits of exercise");

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /^categoría/i }));
    expect(screen.queryByRole("option", { name: "Creada a mano" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Deporte" }));
    choose(/^idioma/i, "Español");
    fireEvent.change(screen.getByLabelText(/enlace de youtube/i), { target: { value: "https://youtu.be/AAAAAAAAAAA" } });
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: "Correr" } });
    fireEvent.click(screen.getByRole("button", { name: /añadir vídeo/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/admin/videos");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ categoryKey: "deporte", locale: "es", youtubeUrl: "https://youtu.be/AAAAAAAAAAA", title: "Correr" });
  });

  it("editar rellena el formulario con el vídeo y guarda con PATCH", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminVideos />));
    const row = await rowOf("The brain-changing benefits of exercise");

    fireEvent.click(within(row).getByRole("button", { name: /editar/i }));
    expect(screen.getByLabelText(/título/i)).toHaveValue("The brain-changing benefits of exercise");
    // El cursor va al formulario (que puede estar fuera de la vista con la lista larga).
    expect(screen.getByLabelText(/título/i)).toHaveFocus();
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: "Exercise and the brain" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(true));
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ id: "v1", categoryKey: "deporte", locale: "en", youtubeUrl: "v1AAAAAAAAA", title: "Exercise and the brain" });
  });

  it("si el vídeo ya está en esa página, lo dice", async () => {
    stubFetch({ writeResponse: { ok: false, status: 409, body: { code: "CONFLICT" } } });
    render(withClient(<AdminVideos />));
    await rowOf("The brain-changing benefits of exercise");

    choose(/^categoría/i, "Deporte");
    choose(/^idioma/i, "Inglés");
    fireEvent.change(screen.getByLabelText(/enlace de youtube/i), { target: { value: "v1AAAAAAAAA" } });
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: "Otra vez" } });
    fireEvent.click(screen.getByRole("button", { name: /añadir vídeo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ya está en esa página/i);
  });

  it("borra un vídeo con su icono", async () => {
    const fetchMock = stubFetch();
    render(withClient(<AdminVideos />));
    const row = await rowOf("The brain-changing benefits of exercise");

    fireEvent.click(within(row).getByRole("button", { name: /borrar/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => url === "/api/admin/videos?id=v1" && init?.method === "DELETE")).toBe(true));
  });

  it("se filtra por categoría y se pagina (5 por página)", async () => {
    const many = [...Array.from({ length: 6 }, (_, index) => video(`d${index}`, "deporte", `Deporte ${index}`)), video("a0", "aventura", "Aventura 0")];
    stubFetch({ videos: many });
    render(withClient(<AdminVideos />));
    const table = await screen.findByRole("table");

    expect(within(table).getAllByRole("row")).toHaveLength(1 + 5);
    // "Todas" se ve escrito en el filtro (con un valor vacío, el desplegable salía en blanco).
    expect(screen.getByRole("combobox", { name: /filtrar por categoría/i })).toHaveTextContent("Todas");
    choose(/filtrar por categoría/i, "Aventura");
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 1);
    expect(within(table).getByText("Aventura 0")).toBeInTheDocument();
  });

  it("desde la última página, al pasar a 25 por página se ven todos (fallo encontrado por el autor)", async () => {
    const many = Array.from({ length: 7 }, (_, index) => video(`d${index}`, "deporte", `Deporte ${index}`));
    stubFetch({ videos: many });
    render(withClient(<AdminVideos />));
    const table = await screen.findByRole("table");

    fireEvent.click(screen.getByRole("button", { name: /siguiente|next/i }));
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 2);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /por página/i }));
    fireEvent.click(screen.getByRole("option", { name: "25" }));

    expect(within(table).getAllByRole("row")).toHaveLength(1 + 7);
  });

  it("si la última página se queda sin filas (al borrar su único vídeo), vuelve a la anterior en lugar de quedarse vacía", async () => {
    const many = Array.from({ length: 6 }, (_, index) => video(`d${index}`, "deporte", `Deporte ${index}`));
    let current = many;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "DELETE") {
          current = current.filter((item) => !url.endsWith(`id=${item.id}`));
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ deleted: true }) });
        }
        const data: Record<string, unknown> = { "/api/admin/videos": current, "/api/categories/translations": LABELS };
        return Promise.resolve({ ok: true, status: 200, json: async () => data[url] ?? [] });
      }),
    );
    render(withClient(<AdminVideos />));
    const table = await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: /siguiente|next/i }));
    const lastRow = await rowOf("Deporte 5");

    fireEvent.click(within(lastRow).getByRole("button", { name: /borrar/i }));

    await waitFor(() => expect(within(table).getAllByRole("row")).toHaveLength(1 + 5));
  });

  it("al cambiar el número por página, vuelve a la primera (con 30 y 25 por página, se ven los 25 primeros, no los del final)", async () => {
    const many = Array.from({ length: 30 }, (_, index) => video(`v${String(index).padStart(2, "0")}`, "deporte", `Deporte ${String(index).padStart(2, "0")}`));
    stubFetch({ videos: many });
    render(withClient(<AdminVideos />));
    const table = await screen.findByRole("table");
    for (let step = 0; step < 5; step++) fireEvent.click(screen.getByRole("button", { name: /siguiente|next/i }));
    expect(within(table).getByText("Deporte 29")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /por página/i }));
    fireEvent.click(screen.getByRole("option", { name: "25" }));

    expect(within(table).getAllByRole("row")).toHaveLength(1 + 25);
    expect(within(table).getByText("Deporte 00")).toBeInTheDocument();
    expect(within(table).queryByText("Deporte 29")).not.toBeInTheDocument();
    expect(screen.getByText("1–25 de 30")).toBeInTheDocument();
  });
});
