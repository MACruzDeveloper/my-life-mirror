// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { InterviewPage } from "@modules/assessments/ui/InterviewPage";

const CATEGORIAS = [
  { id: "c1", name: "Economía", description: "...", status: "active", isSensitiveData: false },
  { id: "c2", name: "Deporte", description: "...", status: "active", isSensitiveData: true },
  { id: "c3", name: "Pareja", description: "...", status: "inactive", isSensitiveData: false },
  { id: "c4", name: "Sexo", description: "...", status: "inactive", isSensitiveData: true },
];

const LATEST = [
  { categoryId: "c1", categoryName: "Economía", score: 6, recordedAt: "2026-09-18T10:00:00.000Z" },
  { categoryId: "c2", categoryName: "Deporte" },
];

const HISTORIAL = [
  { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 4, previousScore: 6 }] },
  { recordedAt: "2026-01-15T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 6 }] },
];

interface Opciones {
  latest?: unknown;
  history?: unknown;
  guardar?: () => Promise<unknown>;
}

function stubFetch({ latest = LATEST, history = HISTORIAL, guardar }: Opciones = {}) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIAS });
    if (url === "/api/assessments/history") return Promise.resolve({ ok: true, json: async () => history });
    if (url === "/api/assessments" && (!init || !init.method || init.method === "GET")) {
      return Promise.resolve({ ok: true, json: async () => latest });
    }
    if (url === "/api/categories/activate") {
      const { categoryId } = JSON.parse(init?.body as string);
      const cat = CATEGORIAS.find((c) => c.id === categoryId);
      if (cat?.isSensitiveData && !fetchMock.mock.calls.some(([u]) => u === "/api/consent/grant")) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "Requiere consentimiento", code: "CONSENT_REQUIRED" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...cat, status: "active" }) });
    }
    if (url === "/api/categories/deactivate") {
      const { categoryId } = JSON.parse(init?.body as string);
      const cat = CATEGORIAS.find((c) => c.id === categoryId);
      return Promise.resolve({ ok: true, json: async () => ({ ...cat, status: "inactive" }) });
    }
    if (url === "/api/assessments") return guardar ? guardar() : Promise.resolve({ ok: true, json: async () => ({ recorded: 1 }) });
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <InterviewPage />
    </MemoryRouter>,
  );
}

async function cargada() {
  await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).toBeInTheDocument());
}

function marcar(categoria: string) {
  fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(categoria, "i") }));
}

function puntuar(categoria: string, valor: number) {
  const grupo = screen.getByRole("group", { name: new RegExp(categoria, "i") });
  fireEvent.click(within(grupo).getByRole("button", { name: String(valor) }));
}

function llamadasPost(fetchMock: ReturnType<typeof vi.fn>, url: string) {
  return fetchMock.mock.calls.filter(([u, init]) => u === url && init?.method === "POST");
}

describe("InterviewPage (RF-10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lista todas las categorías; las activas salen marcadas y con su pregunta", async () => {
    stubFetch();
    renderPage();
    await cargada();

    expect(screen.getByRole("checkbox", { name: /economía/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /pareja/i })).not.toBeChecked();
    expect(screen.getByText("¿Cómo te sientes con Economía?")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /pareja/i })).not.toBeInTheDocument();
  });

  it("precarga la última puntuación y no hay nada que guardar hasta cambiar algo", async () => {
    stubFetch();
    renderPage();
    await cargada();

    const grupo = screen.getByRole("group", { name: /economía/i });
    expect(within(grupo).getByRole("button", { name: "6" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
  });

  it("cambiar una puntuación habilita guardar y solo envía lo cambiado", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await cargada();

    puntuar("economía", 4);
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(screen.getByText(/cambios guardados/i)).toBeInTheDocument());
    const [llamada] = llamadasPost(fetchMock, "/api/assessments");
    expect(JSON.parse(llamada[1].body as string)).toEqual({ entries: [{ categoryId: "c1", score: 4 }] });
    expect(screen.getByRole("link", { name: /ver mis resultados/i })).toHaveAttribute("href", "/perfil/resultados");
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
  });

  it("se puede puntuar por primera vez una categoría sin puntuación previa, con nota", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await cargada();

    puntuar("deporte", 8);
    fireEvent.click(screen.getAllByRole("button", { name: /añadir una nota/i })[1]);
    fireEvent.change(screen.getByLabelText(/nota \(opcional\)/i), { target: { value: "voy al gimnasio" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(screen.getByText(/cambios guardados/i)).toBeInTheDocument());
    const [llamada] = llamadasPost(fetchMock, "/api/assessments");
    expect(JSON.parse(llamada[1].body as string)).toEqual({ entries: [{ categoryId: "c2", score: 8, note: "voy al gimnasio" }] });
  });

  it("marcar una categoría inactiva no sensible la activa y muestra su pregunta", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await cargada();

    marcar("pareja");

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked());
    expect(llamadasPost(fetchMock, "/api/categories/activate")).toHaveLength(1);
    expect(screen.getByRole("group", { name: /pareja/i })).toBeInTheDocument();
  });

  it("desmarcar una categoría activa la desactiva y quita su pregunta", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await cargada();

    marcar("economía");

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).not.toBeChecked());
    expect(llamadasPost(fetchMock, "/api/categories/deactivate")).toHaveLength(1);
    expect(screen.queryByRole("group", { name: /economía/i })).not.toBeInTheDocument();
  });

  it("una categoría sensible pide consentimiento (con enlace a la política) y se activa al aceptar", async () => {
    stubFetch();
    renderPage();
    await cargada();

    marcar("sexo");

    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /leer la política de privacidad/i })).toHaveAttribute("href", "/politica-privacidad");
    fireEvent.click(screen.getByRole("button", { name: /aceptar y activar/i }));

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /sexo/i })).toBeChecked());
    expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument();
  });

  it("cancelar el consentimiento deja la categoría sin activar", async () => {
    stubFetch();
    renderPage();
    await cargada();

    marcar("sexo");
    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: /sexo/i })).not.toBeChecked();
  });

  it("las categorías sensibles van en una columna aparte, con la explicación del consentimiento", async () => {
    stubFetch();
    renderPage();
    await cargada();

    const sensibles = screen.getByRole("group", { name: /requieren tu consentimiento/i });
    expect(within(sensibles).getByRole("checkbox", { name: /sexo/i })).toBeInTheDocument();
    expect(within(sensibles).getByRole("checkbox", { name: /deporte/i })).toBeInTheDocument();
    expect(within(sensibles).queryByRole("checkbox", { name: /pareja/i })).not.toBeInTheDocument();
    expect(within(sensibles).getByText(/datos sensibles/i)).toBeInTheDocument();
  });

  it("'Seleccionar todas' afecta solo a la columna sin consentimiento", async () => {
    stubFetch();
    renderPage();
    await cargada();

    const todas = screen.getByRole("checkbox", { name: /seleccionar todas/i });
    expect(todas).toHaveAttribute("data-indeterminate", "true");
    fireEvent.click(todas);

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked());
    expect(todas).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /sexo/i })).not.toBeChecked();
    expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument();

    fireEvent.click(todas);
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).not.toBeChecked());
    expect(screen.getByRole("checkbox", { name: /pareja/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /deporte/i })).toBeChecked();
  });

  it("muestra a la derecha el historial de cambios, del más reciente al más antiguo", async () => {
    stubFetch();
    renderPage();

    const historial = await screen.findByRole("complementary", { name: /historial/i });
    await waitFor(() => expect(within(historial).getAllByRole("listitem")).toHaveLength(2));
    const items = within(historial).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/septiembre de 2026/i);
    expect(items[0]).toHaveTextContent("Economía: 6 → 4");
    expect(items[1]).toHaveTextContent(/enero de 2026/i);
    expect(items[1]).toHaveTextContent("Economía: 6");
  });

  it("el historial se recarga tras guardar", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await cargada();
    const antes = fetchMock.mock.calls.filter(([u]) => u === "/api/assessments/history").length;

    puntuar("economía", 4);
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([u]) => u === "/api/assessments/history").length).toBeGreaterThan(antes),
    );
  });

  it("junto a cada pregunta hay un icono que despliega y oculta ejemplos", async () => {
    stubFetch();
    renderPage();
    await cargada();

    const info = screen.getByRole("button", { name: /ver ejemplos de economía/i });
    expect(info).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(info);

    expect(info).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/salario/i)).toBeVisible();
  });

  it("la respuesta recibe un fondo suave según la banda (sin colorear el número)", async () => {
    stubFetch();
    renderPage();
    await cargada();

    const grupo = screen.getByRole("group", { name: /economía/i });
    expect(grupo.closest("[data-band]")).toHaveAttribute("data-band", "medium");
    puntuar("economía", 2);
    expect(grupo.closest("[data-band]")).toHaveAttribute("data-band", "low");
  });

  it("muestra el error del servidor al guardar y conserva lo cambiado", async () => {
    stubFetch({ guardar: () => Promise.resolve({ ok: false, json: async () => ({ error: "Only active categories can be scored" }) }) });
    renderPage();
    await cargada();
    puntuar("economía", 4);
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(screen.getByText(/only active categories/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeEnabled();
  });
});
