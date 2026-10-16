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

const LABELS = [
  { catalogId: "k-ave", key: "aventura", translations: { es: { name: "Aventura", description: "Nuevas experiencias y retos." } } },
  { catalogId: "k-dep", key: "deporte", translations: { es: { name: "Deporte", description: "Actividad física." } } },
];
const CATEGORIES = [
  { id: "c-ave", catalogId: "k-ave", name: "Aventura", status: "active" },
  { id: "c-dep", catalogId: "k-dep", name: "Deporte", status: "inactive" },
];

function stubApi({ trips = [] as unknown[], latest = [] as unknown[], diary = [] as unknown[], milestones = {} as Record<string, unknown[]>, shared = {} as Record<string, unknown[]> } = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ id: "t-nuevo", ...JSON.parse(init.body as string) }) });
    if (init?.method === "DELETE") return Promise.resolve({ ok: true, json: async () => ({ deleted: true }) });
    const data: Record<string, unknown> = { "/api/categories/translations": LABELS, "/api/categories": CATEGORIES, "/api/agenda/trips": trips, "/api/assessments": latest, "/api/categories/diary": diary, ...Object.fromEntries(Object.entries(milestones).map(([key, list]) => [`/api/agenda/milestones?category=${key}`, list])), ...Object.fromEntries(Object.entries(shared).map(([categoryId, list]) => [`/api/categories/shared?categoryId=${categoryId}&locale=es`, list])) };
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
    // Solo el número, grande, junto al título de la sección.
    const scoreSection = await screen.findByRole("region", { name: /tu nota ahora/i });
    expect(await within(scoreSection).findByText("7")).toBeInTheDocument();
    expect(within(scoreSection).queryByText(/medio|bajo|bueno/i)).not.toBeInTheDocument();
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

describe("CategoryPage: hitos en Aventura y Deporte (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("Deporte tiene su página: descripción, nota y sus hitos, del más reciente al más antiguo; sin viajes", async () => {
    stubApi({
      milestones: {
        deporte: [
          { id: "m1", categoryKey: "deporte", title: "Media maratón de Valencia", year: 2024, month: 11 },
          { id: "m2", categoryKey: "deporte", title: "Primer 10K", year: 2019 },
        ],
      },
    });
    renderPage("deporte");

    expect(await screen.findByRole("heading", { level: 1, name: "Deporte" })).toBeInTheDocument();
    // La cabecera, con su imagen detrás del título (decorativa: sin texto alternativo).
    const hero = screen.getByTestId("category-hero");
    expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent("Deporte");
    expect(hero.querySelector("img")).toHaveAttribute("alt", "");
    const milestones = await screen.findByRole("region", { name: /carreras, competiciones y marcas/i });
    const items = await within(milestones).findAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/Media maratón de Valencia[\s\S]*noviembre de 2024/);
    expect(items[1]).toHaveTextContent(/Primer 10K[\s\S]*2019/);
    expect(within(milestones).getByText(/no cambian tu nota/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /tus viajes/i })).not.toBeInTheDocument();
  });

  it("Aventura enseña sus retos superados, pedidos para Aventura", async () => {
    const fetchMock = stubApi({ milestones: { aventura: [{ id: "m3", categoryKey: "aventura", title: "Camino de Santiago", year: 2018 }] } });
    renderPage("aventura");

    const milestones = await screen.findByRole("region", { name: /retos superados/i });
    expect(await within(milestones).findByText("Camino de Santiago")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/agenda/milestones?category=aventura")).toBe(true);
  });

  it("añade un hito con título, año y mes, sin volver a pedir la lista; no cambia ninguna nota", { timeout: 20_000 }, async () => {
    const fetchMock = stubApi();
    renderPage("deporte");
    const milestones = await screen.findByRole("region", { name: /carreras, competiciones y marcas/i });
    await within(milestones).findByText(/todavía no has añadido ningún hito/i);

    fireEvent.change(within(milestones).getByRole("textbox", { name: /qué conseguiste/i }), { target: { value: "Media maratón de Valencia" } });
    fireEvent.mouseDown(within(milestones).getByRole("combobox", { name: /^año/i }));
    fireEvent.click(screen.getByRole("option", { name: "2024" }));
    fireEvent.mouseDown(within(milestones).getByRole("combobox", { name: /mes/i }));
    fireEvent.click(screen.getByRole("option", { name: "noviembre" }));
    fireEvent.click(within(milestones).getByRole("button", { name: /añadir hito/i }));

    expect(await within(milestones).findByText("Media maratón de Valencia")).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/agenda/milestones");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ categoryKey: "deporte", title: "Media maratón de Valencia", year: 2024, month: 11 });
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/agenda/milestones?category=deporte" && !init?.method)).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([url, init]) => url.startsWith("/api/assessments") && init?.method === "POST")).toBe(false);
  });

  it("borra un hito", async () => {
    const fetchMock = stubApi({ milestones: { deporte: [{ id: "m1", categoryKey: "deporte", title: "Primer 10K", year: 2019 }] } });
    renderPage("deporte");

    fireEvent.click(await screen.findByRole("button", { name: /borrar.*primer 10k/i }));

    await waitFor(() => expect(screen.getByText(/todavía no has añadido ningún hito/i)).toBeInTheDocument());
    expect(fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE")![0]).toBe("/api/agenda/milestones?id=m1");
  });
});

describe("CategoryPage: vídeos y comunidad (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tres vídeos de inspiración: al principio solo la miniatura; al pulsar, el reproductor sin cookies de YouTube", async () => {
    stubApi();
    renderPage("deporte");

    const videos = await screen.findByRole("region", { name: /para inspirarte/i });
    const play = within(videos).getAllByRole("button", { name: /reproducir/i });
    expect(play).toHaveLength(3);
    expect(videos.querySelector("iframe")).toBeNull();

    fireEvent.click(play[0]);

    const player = videos.querySelector("iframe")!;
    expect(player.getAttribute("src")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?autoplay=1$/);
    expect(player).toHaveAttribute("title");
  });

  it("'De la comunidad': lo que comparten otras personas en esta categoría, con su aviso y la opción de reportar", async () => {
    const fetchMock = stubApi({ shared: { "c-dep": [{ id: "s1", text: "Correr con amigos los domingos me cambió la semana." }] } });
    renderPage("deporte");

    const community = await screen.findByRole("region", { name: /de la comunidad/i });
    expect(await within(community).findByText(/correr con amigos los domingos/i)).toBeInTheDocument();
    expect(within(community).getByText(/no son consejo profesional|no sustituyen/i)).toBeInTheDocument();

    fireEvent.click(within(community).getByRole("button", { name: /reportar/i }));

    await waitFor(() => expect(within(community).queryByText(/correr con amigos los domingos/i)).not.toBeInTheDocument());
    const report = fetchMock.mock.calls.find(([url, init]) => url === "/api/categories/shared" && init?.method === "POST")!;
    expect(JSON.parse(report[1]!.body as string)).toEqual({ id: "s1" });
  });

  it("si nadie ha compartido nada todavía, lo dice", async () => {
    stubApi();
    renderPage("deporte");

    const community = await screen.findByRole("region", { name: /de la comunidad/i });
    expect(await within(community).findByText(/todavía nadie ha compartido/i)).toBeInTheDocument();
  });
});
