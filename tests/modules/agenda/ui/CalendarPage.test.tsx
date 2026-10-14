// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CalendarPage } from "@modules/agenda/ui/CalendarPage";
import { createTestClient, withClient } from "../../../helpers/queryClient";

const CATEGORIES = [
  { id: "c1", catalogId: "k-social", name: "Vida social", status: "active" },
  { id: "c2", catalogId: "k-eco", name: "Economía", status: "inactive" },
  { id: "c3", catalogId: "k-fam", name: "Familia", status: "active" },
];
const LABELS = [
  { catalogId: "k-social", key: "vidaSocial", translations: { es: { name: "Vida social", description: "" } } },
  { catalogId: "k-eco", key: "economia", translations: { es: { name: "Economía", description: "" } } },
  { catalogId: "k-fam", key: "familia", translations: { es: { name: "Familia", description: "" } } },
];

function stubApi(events: unknown[], reactions: unknown[] = []) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ id: "nuevo", ...JSON.parse(init.body as string) }) });
    if (init?.method === "DELETE") return Promise.resolve({ ok: true, json: async () => ({ deleted: true }) });
    const data = url === "/api/agenda/events" ? events : url === "/api/recommendations/reactions" ? reactions : url === "/api/categories" ? CATEGORIES : url === "/api/categories/translations" ? LABELS : [];
    return Promise.resolve({ ok: true, json: async () => data });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CalendarPage (RF-48)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 13, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("enseña el mes actual con los días que tienen algo marcados, y lo de hoy al abrir", async () => {
    stubApi([{ id: "e1", title: "Boda de Marta", day: "2026-10-24", categoryIds: ["c1", "c3"] }], [{ categoryId: "c1", templateKey: "vidaSocial.1", reaction: "saved", reactedAt: "", plannedFor: "2026-10-20" }]);
    render(withClient(<CalendarPage />));

    expect(await screen.findByRole("heading", { name: /octubre de 2026/i })).toBeInTheDocument();
    const day24 = await screen.findByRole("button", { name: /24 de octubre.*1 anotación/i });
    expect(screen.getByRole("button", { name: /20 de octubre.*1 anotación/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^martes, 13 de octubre$/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(day24);

    const dayPanel = screen.getByRole("region", { name: /24 de octubre/i });
    expect(within(dayPanel).getByText("Boda de Marta")).toBeInTheDocument();
    expect(within(dayPanel).getByText("Vida social · Familia")).toBeInTheDocument();
  });

  it("una idea guardada con fecha sale en su día, con su texto", async () => {
    stubApi([], [{ categoryId: "c1", templateKey: "vidaSocial.1", reaction: "saved", reactedAt: "", plannedFor: "2026-10-20" }]);
    render(withClient(<CalendarPage />));

    fireEvent.click(await screen.findByRole("button", { name: /20 de octubre.*1 anotación/i }));

    const item = within(screen.getByRole("region", { name: /20 de octubre/i })).getByRole("listitem");
    expect(item).toHaveTextContent(/idea guardada/i);
    expect(item).not.toHaveTextContent("vidaSocial.1");
  });

  it("añade un evento en el día elegido, con varias categorías activas (las inactivas no se ofrecen), y aparece sin volver a pedir la lista", async () => {
    const fetchMock = stubApi([]);
    render(withClient(<CalendarPage />));
    fireEvent.click(await screen.findByRole("button", { name: /^sábado, 24 de octubre$/i }));

    fireEvent.change(screen.getByLabelText(/qué tienes/i), { target: { value: "Boda de Marta" } });
    const categories = within(screen.getByRole("group", { name: /categorías/i }));
    expect(categories.queryByRole("button", { name: "Economía" })).not.toBeInTheDocument();
    // Sin categorías elegidas, se explica para qué sirven; la promesa concreta sale al elegir.
    expect(screen.getByText(/si eliges alguna, el día del evento/i)).toBeInTheDocument();
    expect(screen.queryByText(/no la cambia por ti/i)).not.toBeInTheDocument();
    fireEvent.click(categories.getByRole("button", { name: "Vida social" }));
    fireEvent.click(categories.getByRole("button", { name: "Familia" }));
    expect(categories.getByRole("button", { name: "Familia" })).toHaveAttribute("aria-pressed", "true");
    // Se dice qué hará la app con esto: invitar, no puntuar.
    expect(screen.getByText(/te invitará a revisar tu nota.*no la cambia por ti/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /añadir/i }));

    expect(await within(screen.getByRole("region", { name: /24 de octubre/i })).findByText("Boda de Marta")).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/agenda/events");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ title: "Boda de Marta", day: "2026-10-24", categoryIds: ["c1", "c3"] });
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/agenda/events" && !init?.method)).toHaveLength(1);
  });

  it("cambiar de día con el título ya escrito no lo borra: el evento se crea en el día nuevo", async () => {
    const fetchMock = stubApi([]);
    render(withClient(<CalendarPage />));
    await screen.findByRole("heading", { name: /octubre de 2026/i });

    fireEvent.change(screen.getByLabelText(/qué tienes/i), { target: { value: "Cumpleaños de mi madre" } });
    fireEvent.click(screen.getByRole("button", { name: /^sábado, 31 de octubre$/i }));
    expect(screen.getByLabelText(/qué tienes/i)).toHaveValue("Cumpleaños de mi madre");
    fireEvent.change(screen.getByLabelText(/^día/i), { target: { value: "2026-10-30" } });
    expect(screen.getByLabelText(/qué tienes/i)).toHaveValue("Cumpleaños de mi madre");
    fireEvent.click(screen.getByRole("button", { name: /añadir/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ title: "Cumpleaños de mi madre", day: "2026-10-30", categoryIds: [] });
  });

  it("hoy se distingue del resto de días, también cuando no es el elegido", async () => {
    stubApi([]);
    render(withClient(<CalendarPage />));
    const today = await screen.findByRole("button", { name: /^martes, 13 de octubre$/i });
    expect(today).toHaveAttribute("aria-current", "date");

    fireEvent.click(screen.getByRole("button", { name: /^sábado, 31 de octubre$/i }));

    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /^sábado, 31 de octubre$/i })).not.toHaveAttribute("aria-current");
  });

  it("borra un evento", async () => {
    const fetchMock = stubApi([{ id: "e1", title: "Cena", day: "2026-10-13" }]);
    render(withClient(<CalendarPage />));

    fireEvent.click(await screen.findByRole("button", { name: /borrar.*cena/i }));

    await waitFor(() => expect(screen.queryByText("Cena")).not.toBeInTheDocument());
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE")!;
    expect(call[0]).toBe("/api/agenda/events?id=e1");
  });

  it("se pasa de mes con las flechas; sin botón 'Hoy' (hoy ya se ve en naranja)", async () => {
    stubApi([]);
    render(withClient(<CalendarPage />));
    await screen.findByRole("heading", { name: /octubre de 2026/i });
    expect(screen.queryByRole("button", { name: /^hoy$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mes siguiente/i }));
    expect(screen.getByRole("heading", { name: /noviembre de 2026/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mes anterior/i }));
    expect(screen.getByRole("heading", { name: /octubre de 2026/i })).toBeInTheDocument();
  });

  it("volver a la pantalla usa la caché", async () => {
    const fetchMock = stubApi([{ id: "e1", title: "Cena", day: "2026-10-13" }]);
    const client = createTestClient();
    const first = render(withClient(<CalendarPage />, client));
    await screen.findByText("Cena");
    first.unmount();

    render(withClient(<CalendarPage />, client));
    await screen.findByText("Cena");

    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/agenda/events")).toHaveLength(1);
  });
});
