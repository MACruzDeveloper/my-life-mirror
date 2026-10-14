// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { CategoryPage } from "@modules/categories/ui/CategoryPage";
import { createTestClient, withClient } from "../../../helpers/queryClient";

// El mapa (Leaflet) no funciona en jsdom: se sustituye por un doble que cuenta los países pintados y deja pulsar uno.
vi.mock("@modules/agenda/ui/trips/TripsMap", () => ({
  TripsMap: ({ trips, onCountryClick }: { trips: { countryCode: string }[]; onCountryClick: (code: string) => void }) => (
    <div>
      <span>{new Set(trips.map((trip) => trip.countryCode)).size} países pintados</span>
      <button type="button" onClick={() => onCountryClick("JP")}>
        pulsar Japón en el mapa
      </button>
    </div>
  ),
}));

const LABELS = [{ catalogId: "k-ave", key: "aventura", translations: { es: { name: "Aventura", description: "Nuevas experiencias y retos." } } }];
const CATEGORIES = [{ id: "c-ave", catalogId: "k-ave", name: "Aventura", status: "active" }];

function stubApi({ trips = [] as unknown[], latest = [] as unknown[], diary = [] as unknown[] } = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ id: "t-nuevo", ...JSON.parse(init.body as string) }) });
    if (init?.method === "DELETE") return Promise.resolve({ ok: true, json: async () => ({ deleted: true }) });
    const data: Record<string, unknown> = { "/api/categories/translations": LABELS, "/api/categories": CATEGORIES, "/api/agenda/trips": trips, "/api/assessments": latest, "/api/categories/diary": diary };
    return Promise.resolve({ ok: true, json: async () => data[url] ?? [] });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage(key: string, client = createTestClient()) {
  return render(
    withClient(
      <MemoryRouter initialEntries={[`/categorias/${key}`]}>
        <Routes>
          <Route path="/categorias/:key" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
      client,
    ),
  );
}

// Los dos tests que abren las listas de países (236) y de años (129) son lentos con la cobertura activa: más margen.
describe("CategoryPage: Aventura (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("enseña la descripción, la última nota, las experiencias del diario y los viajes", async () => {
    stubApi({
      latest: [{ categoryId: "c-ave", categoryName: "Aventura", catalogId: "k-ave", score: 7, recordedAt: "2026-10-01T10:00:00Z" }],
      diary: [
        { id: "x1", categoryId: "c-ave", text: "Subí a una montaña por primera vez", createdAt: "2026-09-10T10:00:00Z" },
        { id: "x2", categoryId: "otra", text: "No es de Aventura", createdAt: "2026-09-11T10:00:00Z" },
      ],
      trips: [
        { id: "t1", countryCode: "PT", year: 2015, month: 6 },
        { id: "t2", countryCode: "PT", year: 2012 },
      ],
    });

    renderPage("aventura");

    expect(await screen.findByRole("heading", { level: 1, name: "Aventura" })).toBeInTheDocument();
    expect(screen.getByText("Nuevas experiencias y retos.")).toBeInTheDocument();
    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(await screen.findByText("Subí a una montaña por primera vez")).toBeInTheDocument();
    expect(screen.queryByText("No es de Aventura")).not.toBeInTheDocument();
    const trips = await screen.findByRole("region", { name: /tus viajes/i });
    const items = within(trips).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Portugal");
    expect(items[0]).toHaveTextContent(/junio de 2015/);
    expect(items[1]).toHaveTextContent("2012");
    expect(await within(trips).findByText("1 países pintados")).toBeInTheDocument();
  });

  it("sin nota todavía, invita a puntuarla", async () => {
    stubApi();
    renderPage("aventura");

    expect(await screen.findByRole("link", { name: /puntuar aventura/i })).toHaveAttribute("href", "/perfil/entrevista");
  });

  it("añade un viaje eligiendo país (de la lista, con búsqueda), año y mes opcional, sin volver a pedir la lista; no cambia ninguna nota", { timeout: 20_000 }, async () => {
    const fetchMock = stubApi();
    renderPage("aventura");
    const trips = await screen.findByRole("region", { name: /tus viajes/i });
    expect(within(trips).getByText(/no cambian tu nota/i)).toBeInTheDocument();

    fireEvent.change(within(trips).getByRole("combobox", { name: /país/i }), { target: { value: "myan" } });
    fireEvent.click(await screen.findByRole("option", { name: /myanmar/i }));
    fireEvent.mouseDown(within(trips).getByRole("combobox", { name: /^año/i }));
    fireEvent.click(screen.getByRole("option", { name: "2015" }));
    fireEvent.click(within(trips).getByRole("button", { name: /añadir viaje/i }));

    expect(await within(trips).findByText(/myanmar/i, { selector: "li *" })).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/agenda/trips");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ countryCode: "MM", year: 2015 });
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/agenda/trips" && !init?.method)).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([url, init]) => url.startsWith("/api/assessments") && init?.method === "POST")).toBe(false);
  });

  it("con mes, lo envía; y pulsar un país en el mapa lo elige en el formulario", { timeout: 20_000 }, async () => {
    const fetchMock = stubApi();
    renderPage("aventura");
    const trips = await screen.findByRole("region", { name: /tus viajes/i });

    fireEvent.click(await within(trips).findByRole("button", { name: /pulsar japón/i }));
    expect(within(trips).getByRole("combobox", { name: /país/i })).toHaveValue("Japón");
    fireEvent.mouseDown(within(trips).getByRole("combobox", { name: /^año/i }));
    fireEvent.click(screen.getByRole("option", { name: "2027" }));
    fireEvent.mouseDown(within(trips).getByRole("combobox", { name: /mes/i }));
    fireEvent.click(screen.getByRole("option", { name: "marzo" }));
    fireEvent.click(within(trips).getByRole("button", { name: /añadir viaje/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ countryCode: "JP", year: 2027, month: 3 });
  });

  it("borra un viaje", async () => {
    const fetchMock = stubApi({ trips: [{ id: "t1", countryCode: "PT", year: 2015, month: 6 }] });
    renderPage("aventura");

    fireEvent.click(await screen.findByRole("button", { name: /borrar.*portugal/i }));

    await waitFor(() => expect(screen.getByText(/todavía no has añadido ningún viaje/i)).toBeInTheDocument());
    expect(fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE")![0]).toBe("/api/agenda/trips?id=t1");
  });

  it("una categoría sin página lo dice y enlaza a Categorías", async () => {
    stubApi();
    renderPage("economia");

    expect(await screen.findByText(/todavía no tiene página/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver todas las categorías/i })).toHaveAttribute("href", "/categorias");
  });
});
