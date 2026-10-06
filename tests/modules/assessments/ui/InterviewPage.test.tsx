// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// La entrevista entera en jsdom (MUI, varias consultas, una pregunta por categoría) tarda ~1 s por test
// solo; con toda la batería en paralelo puede multiplicarse y rozar los 5 s por defecto. Medido el 5 oct.:
// no es una regresión (antes de RF-44 ya iba a ~0,64 s por test), así que se ajusta el límite solo aquí.
vi.setConfig({ testTimeout: 15_000 });
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { InterviewPage } from "@modules/assessments/ui/InterviewPage";
import { SessionProvider } from "@shared/ui/context/SessionContext";
import i18n from "@shared/ui/i18n";
import { createTestClient, withClient } from "../../../helpers/queryClient";
import type { QueryClient } from "@tanstack/react-query";
import { categoryLabelsFixture } from "../../../helpers/categoryLabels";

const CATEGORIES = [
  { id: "c1", catalogId: "k-economia", name: "Economía", description: "...", status: "active", isSensitiveData: false, experienceTags: ["economia.presupuesto"] },
  { id: "c2", catalogId: "k-deporte", name: "Deporte", description: "...", status: "active", isSensitiveData: true },
  { id: "c3", catalogId: "k-pareja", name: "Pareja", description: "...", status: "inactive", isSensitiveData: false },
  { id: "c4", catalogId: "k-sexo", name: "Sexo", description: "...", status: "inactive", isSensitiveData: true },
];

const LATEST = [
  { categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 6, recordedAt: "2026-09-18T10:00:00.000Z" },
  { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte" },
];

const HISTORY = [
  { recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 4, previousScore: 6, note: "Este mes he ahorrado un poco" }] },
  { recordedAt: "2026-01-15T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 6, note: "Mes justo" }] },
];

// RF-44: el diario de experiencias (la más reciente primero, como lo devuelve el servidor).
const EXPERIENCES = [
  { id: "e3", categoryId: "c1", text: "Este mes he ahorrado un poco", createdAt: "2026-09-18T10:00:00.000Z" },
  { id: "e2", categoryId: "c1", text: "Mes justo", createdAt: "2026-01-15T10:00:00.000Z" },
  { id: "e1", categoryId: "c1", text: "Empecé a apuntar gastos", createdAt: "2025-12-01T10:00:00.000Z" },
  { id: "e0", categoryId: "c1", text: "Primera nota", createdAt: "2025-11-01T10:00:00.000Z" },
];

interface StubOptions {
  latest?: unknown;
  history?: unknown;
  recommendations?: unknown;
  /** Recomendaciones abiertas después de guardar (las devuelve el POST, PERF-01; por defecto, las mismas que antes). */
  recommendationsAfterSave?: unknown;
  saveResponse?: () => Promise<unknown>;
  /** RF-44: experiencias del diario (GET /api/categories/diary). */
  experiences?: unknown;
  /** RF-43: si compartir falla los filtros del servidor, el motivo (422). */
  shareRejection?: string;
}

// Por defecto, el diario vacío: cada experiencia añade botones a la página y encarece todas las búsquedas por rol.

function stubFetch({ latest = LATEST, history = HISTORY, recommendations = [], recommendationsAfterSave, saveResponse, experiences = [], shareRejection }: StubOptions = {}) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIES });
    if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() });
    if (url === "/api/assessments/history") return Promise.resolve({ ok: true, json: async () => history });
    if (url === "/api/recommendations") {
      const saved = fetchMock.mock.calls.some(([urlCalled, initCalled]) => urlCalled === "/api/assessments" && initCalled?.method === "POST");
      return Promise.resolve({ ok: true, json: async () => (saved && recommendationsAfterSave !== undefined ? recommendationsAfterSave : recommendations) });
    }
    if (url === "/api/assessments" && (!init || !init.method || init.method === "GET")) {
      return Promise.resolve({ ok: true, json: async () => (typeof latest === "function" ? latest() : latest) });
    }
    if (url === "/api/categories/activate") {
      const { categoryId } = JSON.parse(init?.body as string);
      const category = CATEGORIES.find((category) => category.id === categoryId);
      if (category?.isSensitiveData && !fetchMock.mock.calls.some(([urlCalled]) => urlCalled === "/api/consent/grant")) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "Requiere consentimiento", code: "CONSENT_REQUIRED" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...category, status: "active" }) });
    }
    if (url.startsWith("/api/categories/diary")) {
      if (!init?.method || init.method === "GET") return Promise.resolve({ ok: true, json: async () => experiences });
      if (init.method === "DELETE") return Promise.resolve({ ok: true, json: async () => ({ deleted: true }) });
      if (init.method === "PATCH") {
        const { id, shared } = JSON.parse(init.body as string);
        if (shared && shareRejection) return Promise.resolve({ ok: false, status: 422, json: async () => ({ error: "Not shareable", reason: shareRejection }) });
        const experience = (experiences as { id: string }[]).find((candidate) => candidate.id === id);
        return Promise.resolve({ ok: true, json: async () => ({ ...experience, shared, reported: false }) });
      }
      const { categoryId, text } = JSON.parse(init.body as string);
      return Promise.resolve({ ok: true, json: async () => ({ id: `e-${text}`, categoryId, text, createdAt: "2026-10-05T10:00:00.000Z" }) });
    }
    if (url === "/api/categories/experience") {
      const { categoryId, tags } = JSON.parse(init?.body as string);
      const category = CATEGORIES.find((category) => category.id === categoryId);
      return Promise.resolve({ ok: true, json: async () => ({ ...category, experienceTags: tags }) });
    }
    if (url === "/api/categories/deactivate") {
      const { categoryId } = JSON.parse(init?.body as string);
      const category = CATEGORIES.find((category) => category.id === categoryId);
      return Promise.resolve({ ok: true, json: async () => ({ ...category, status: "inactive" }) });
    }
    if (url === "/api/assessments") {
      if (saveResponse) return saveResponse();
      // Como el servidor (PERF-01): las últimas puntuaciones con lo guardado ya aplicado, y las recomendaciones abiertas.
      const { entries } = JSON.parse(init?.body as string) as { entries: { categoryId: string; score: number }[] };
      const current = (typeof latest === "function" ? latest() : latest) as { categoryId: string; score?: number }[];
      const updated = current.map((latestScore) => {
        const saved = entries.find((entry) => entry.categoryId === latestScore.categoryId);
        return saved ? { ...latestScore, score: saved.score, recordedAt: "2026-10-04T10:00:00.000Z" } : latestScore;
      });
      return Promise.resolve({ ok: true, json: async () => ({ recorded: entries.length, latest: updated, recommendations: recommendationsAfterSave ?? recommendations }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage(client: QueryClient = createTestClient()) {
  return render(
    withClient(
      <MemoryRouter>
        <InterviewPage />
      </MemoryRouter>,
      client,
    ),
  );
}

/**
 * UX-06: al actualizar, las categorías van en acordeones plegados; se abren para poder marcarlas.
 * Por texto y no por rol: `queryByRole` calcula el nombre accesible de todos los botones de la
 * entrevista (más de 40) y, llamado en cada test, triplicaba la duración del archivo.
 */
function openCategoryAccordions() {
  for (const title of ["Tus categorías", "Your categories", "Requieren tu consentimiento", "Require your consent"]) {
    const summary = screen.queryByText(title)?.closest("[aria-expanded]");
    if (summary?.getAttribute("aria-expanded") === "false") fireEvent.click(summary);
  }
}

async function waitUntilLoaded() {
  await screen.findByRole("heading", { level: 1 });
  openCategoryAccordions();
  await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).toBeInTheDocument());
}

function toggleCategory(categoryName: string) {
  fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(categoryName, "i") }));
}

function chooseScore(categoryName: string, score: number) {
  const group = screen.getByRole("group", { name: new RegExp(categoryName, "i") });
  fireEvent.click(within(group).getByRole("button", { name: String(score) }));
}

function saveButton(categoryName: string) {
  return screen.getByRole("button", { name: `Guardar ${categoryName}` });
}

function question(categoryId: string) {
  return document.getElementById(`pregunta-${categoryId}`)!;
}

const LOW_ECONOMY_IDEA = { id: "r1", categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", templateKey: "economia.1", status: "pending" };

function postCalls(fetchMock: ReturnType<typeof vi.fn>, url: string) {
  return fetchMock.mock.calls.filter(([urlCalled, init]) => urlCalled === url && init?.method === "POST");
}

describe("InterviewPage (RF-10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("categorías en acordeón al actualizar (UX-06)", () => {
    it("con respuestas guardadas, las dos listas van plegadas, cada una con cuántas tiene activas", async () => {
      stubFetch();
      renderPage();
      await screen.findByRole("heading", { level: 1, name: /actualiza tus respuestas/i });

      const regular = screen.getByRole("button", { name: /^tus categorías/i });
      const sensitive = screen.getByRole("button", { name: /^requieren tu consentimiento/i });
      expect(regular).toHaveAttribute("aria-expanded", "false");
      expect(regular).toHaveTextContent("1 de 2 activas");
      expect(sensitive).toHaveAttribute("aria-expanded", "false");
      expect(sensitive).toHaveTextContent("1 de 2 activas");
      expect(screen.queryByRole("checkbox", { name: /pareja/i })).not.toBeInTheDocument();
      expect(screen.getByText("¿Cómo te sientes con Economía?")).toBeInTheDocument();

      fireEvent.click(regular);
      expect(await screen.findByRole("checkbox", { name: /pareja/i })).not.toBeChecked();
    });

  });

  describe("primera entrevista por pasos (UX-07)", () => {
    // Sin respuestas guardadas: Economía y Deporte activas pero sin puntuar.
    const FIRST_TIME = [
      { categoryId: "c1", catalogId: "k-economia", categoryName: "Economía" },
      { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte" },
    ];

    function categoryButton(name: string) {
      return screen.getByRole("button", { name: new RegExp(`^${name}`, "i") });
    }

    async function openFirstTime() {
      const fetchMock = stubFetch({ latest: FIRST_TIME, history: [] });
      renderPage();
      await screen.findByRole("heading", { level: 1, name: /tu entrevista/i });
      return fetchMock;
    }

    function currentStep() {
      return document.querySelector('[aria-current="step"]');
    }

    it("paso 1: la introducción con la escala y 'Empezar'; ni categorías ni preguntas todavía", async () => {
      await openFirstTime();

      expect(currentStep()).toHaveTextContent("Introducción");
      expect(screen.getByText(/1 = muy mal/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Empezar" })).toBeInTheDocument();
      expect(screen.queryByRole("checkbox", { name: /pareja/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^pareja/i })).not.toBeInTheDocument();
      expect(screen.queryByText("¿Cómo te sientes con Economía?")).not.toBeInTheDocument();
    });

    it("paso 2: cada categoría es un botón que se marca al tocarlo y la activa al momento", async () => {
      const fetchMock = await openFirstTime();
      fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

      expect(screen.getByRole("heading", { name: "¿De qué quieres hablar?" })).toBeInTheDocument();
      expect(currentStep()).toHaveTextContent("Categorías");
      expect(categoryButton("economía")).toHaveAttribute("aria-pressed", "true");
      expect(categoryButton("pareja")).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(categoryButton("pareja"));

      expect(categoryButton("pareja")).toHaveAttribute("aria-pressed", "true");
      await waitFor(() => expect(postCalls(fetchMock, "/api/categories/activate")).toHaveLength(1));
      expect(screen.queryByText("¿Cómo te sientes con Pareja?")).not.toBeInTheDocument();
    });

    it("paso 2: sin ninguna categoría elegida no se puede seguir", async () => {
      await openFirstTime();
      fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

      fireEvent.click(categoryButton("economía"));
      fireEvent.click(categoryButton("deporte"));

      await waitFor(() => expect(screen.getByRole("button", { name: "Ir a las preguntas" })).toBeDisabled());
    });

    it("paso 2: una categoría sensible pide consentimiento antes de activarse", async () => {
      await openFirstTime();
      fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

      fireEvent.click(categoryButton("sexo"));

      expect(await screen.findByText(/se necesita tu consentimiento/i)).toBeInTheDocument();
    });

    it("paso 3: las preguntas, las categorías elegidas en su acordeón y la introducción plegada", async () => {
      await openFirstTime();
      fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
      fireEvent.click(screen.getByRole("button", { name: "Ir a las preguntas" }));

      expect(currentStep()).toHaveTextContent("Preguntas");
      expect(screen.getByText("¿Cómo te sientes con Economía?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^tus categorías/i })).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText("Releer la introducción").closest("[aria-expanded]")).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("button", { name: "Empezar" })).not.toBeInTheDocument();
    });

    it("paso 3: guardar la primera categoría no cambia la pantalla", async () => {
      await openFirstTime();
      fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
      fireEvent.click(screen.getByRole("button", { name: "Ir a las preguntas" }));

      chooseScore("economía", 7);
      fireEvent.click(saveButton("Economía"));

      expect(await within(question("c1")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
      expect(screen.getByRole("heading", { level: 1, name: /tu entrevista/i })).toBeInTheDocument();
      expect(currentStep()).toHaveTextContent("Preguntas");
      expect(screen.queryByRole("button", { name: "Empezar" })).not.toBeInTheDocument();
    });

    it("con respuestas guardadas no hay pasos", async () => {
      stubFetch();
      renderPage();
      await screen.findByRole("heading", { level: 1, name: /actualiza tus respuestas/i });

      expect(currentStep()).toBeNull();
      expect(screen.queryByRole("button", { name: "Empezar" })).not.toBeInTheDocument();
    });
  });

  it("si la carga falla, lo dice y deja reintentar (sin reintentos automáticos)", async () => {
    let categoriesCalls = 0;
    const fetchMock = stubFetch();
    const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/categories" && (categoriesCalls += 1) === 1) return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: "caído" }) });
      return defaultImplementation(url, init);
    });
    renderPage();

    const alert = await screen.findByText("No se pudieron cargar tus categorías");
    fireEvent.click(within(alert.closest("[role=alert]") as HTMLElement).getByRole("button", { name: "Reintentar" }));

    await waitUntilLoaded();
    expect(screen.queryByText("No se pudieron cargar tus categorías")).not.toBeInTheDocument();
    expect(categoriesCalls).toBe(2);
  });

  it("lista todas las categorías; las activas salen marcadas y con su pregunta", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    expect(screen.getByRole("checkbox", { name: /economía/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /pareja/i })).not.toBeChecked();
    expect(screen.getByText("¿Cómo te sientes con Economía?")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /pareja/i })).not.toBeInTheDocument();
  });

  it("precarga la última puntuación y no hay nada que guardar hasta cambiar algo", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const group = screen.getByRole("group", { name: /economía/i });
    expect(within(group).getByRole("button", { name: "6" })).toHaveAttribute("aria-pressed", "true");
    expect(saveButton("Economía")).toBeDisabled();
    expect(saveButton("Deporte")).toBeDisabled();
  });

  it("cada categoría tiene su 'Guardar': se habilita al cambiarla y guarda solo esa (UX-05)", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await waitUntilLoaded();

    chooseScore("economía", 4);
    chooseScore("deporte", 8);
    expect(saveButton("Economía")).toBeEnabled();
    fireEvent.click(saveButton("Economía"));

    expect(await within(question("c1")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
    const [call] = postCalls(fetchMock, "/api/assessments");
    expect(JSON.parse(call[1].body as string)).toEqual({ entries: [{ categoryId: "c1", score: 4 }] });
    expect(saveButton("Economía")).toBeDisabled();
    expect(saveButton("Deporte")).toBeEnabled();
    expect(within(screen.getByRole("group", { name: /puntuación de deporte/i })).getByRole("button", { name: "8" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ya no hay un botón único de 'Guardar cambios' al final", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    expect(screen.queryByRole("button", { name: /guardar cambios/i })).not.toBeInTheDocument();
  });

  it("se puede puntuar por primera vez una categoría sin puntuación previa (la experiencia ya no va con la puntuación, RF-44)", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await waitUntilLoaded();

    chooseScore("deporte", 8);
    fireEvent.click(saveButton("Deporte"));

    expect(await within(question("c2")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
    const [call] = postCalls(fetchMock, "/api/assessments");
    expect(JSON.parse(call[1].body as string)).toEqual({ entries: [{ categoryId: "c2", score: 8 }] });
  });

  describe("respuesta inmediata (UX-05)", () => {
    it("bajo su pregunta se ve la última actualización (fecha y cambio)", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      const box = (await within(question("c1")).findByText(/última actualización/i)).closest("[data-last-update]") as HTMLElement;
      expect(box).toHaveTextContent("Última actualización: 18 de septiembre de 2026 · 6 → 4");
      expect(within(question("c2")).queryByText(/última actualización/i)).not.toBeInTheDocument();
    });

    it("sin idea nueva, 'Guardado ahora' sale en la categoría, sin ventana, y se quita al volver a cambiarla", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      chooseScore("economía", 7);
      fireEvent.click(saveButton("Economía"));

      expect(await within(question("c1")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      chooseScore("economía", 8);
      expect(within(question("c1")).queryByRole("status")).not.toBeInTheDocument();
    });

    it("si el guardado abre una idea nueva, un modal la enseña con el aviso y los siguientes pasos; 'Seguir aquí' lo cierra", async () => {
      stubFetch({ recommendations: [], recommendationsAfterSave: [LOW_ECONOMY_IDEA] });
      renderPage();
      await waitUntilLoaded();

      chooseScore("economía", 2);
      fireEvent.click(saveButton("Economía"));

      const dialog = await screen.findByRole("dialog", { name: /cambios guardados/i });
      expect(within(dialog).getByText(/tienes una idea para economía/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: /ver mis resultados/i })).toHaveAttribute("href", "/perfil/resultados");
      expect(within(dialog).getByRole("link", { name: /ir a inicio/i })).toHaveAttribute("href", "/inicio");
      fireEvent.click(within(dialog).getByRole("button", { name: /seguir aquí/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(within(question("c1")).getByRole("status")).toHaveTextContent(/guardado ahora/i);
    });

    it("si la idea de esa categoría ya estaba abierta, no vuelve a abrir el modal", async () => {
      stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
      renderPage();
      await waitUntilLoaded();

      chooseScore("economía", 3);
      fireEvent.click(saveButton("Economía"));

      expect(await within(question("c1")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("si falla, el error sale en esa categoría y lo cambiado se conserva", async () => {
      stubFetch({ saveResponse: () => Promise.resolve({ ok: false, json: async () => ({ error: "Only active categories can be scored" }) }) });
      renderPage();
      await waitUntilLoaded();
      chooseScore("economía", 4);
      fireEvent.click(saveButton("Economía"));

      expect(await within(question("c1")).findByText(/only active categories/i)).toBeInTheDocument();
      expect(saveButton("Economía")).toBeEnabled();
      expect(within(screen.getByRole("group", { name: /puntuación de economía/i })).getByRole("button", { name: "4" })).toHaveAttribute("aria-pressed", "true");
    });

    it("tras guardar usa lo que devuelve el servidor: no vuelve a pedir las puntuaciones ni las recomendaciones (PERF-01)", async () => {
      const fetchMock = stubFetch({ recommendations: [], recommendationsAfterSave: [LOW_ECONOMY_IDEA] });
      renderPage();
      await waitUntilLoaded();
      const gets = (url: string) => fetchMock.mock.calls.filter(([urlCalled, init]) => urlCalled === url && !init?.method).length;
      const before = { latest: gets("/api/assessments"), recommendations: gets("/api/recommendations"), history: gets("/api/assessments/history") };

      chooseScore("economía", 2);
      fireEvent.click(saveButton("Economía"));

      expect(await screen.findByRole("dialog", { name: /cambios guardados/i })).toBeInTheDocument();
      await waitFor(() => expect(gets("/api/assessments/history")).toBe(before.history + 1));
      expect(gets("/api/assessments")).toBe(before.latest);
      expect(gets("/api/recommendations")).toBe(before.recommendations);
      // Con el modal abierto, el resto de la página está oculto a la accesibilidad: `hidden` para mirar debajo.
      const group = screen.getByRole("group", { name: /puntuación de economía/i, hidden: true });
      expect(within(group).getByRole("button", { name: "2", hidden: true })).toHaveAttribute("aria-pressed", "true");
    });

    it("guardar vuelve a pedir el historial, del que sale la última actualización", async () => {
      const fetchMock = stubFetch();
      renderPage();
      await waitUntilLoaded();
      const callsBefore = fetchMock.mock.calls.filter(([urlCalled]) => urlCalled === "/api/assessments/history").length;

      chooseScore("economía", 4);
      fireEvent.click(saveButton("Economía"));

      await waitFor(() =>
        expect(fetchMock.mock.calls.filter(([urlCalled]) => urlCalled === "/api/assessments/history").length).toBeGreaterThan(callsBefore),
      );
    });

    it("una categoría con una idea abierta enseña 'Ideas para…' en su pregunta, que abre el carrusel", async () => {
      stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(await within(question("c1")).findByRole("button", { name: "Ideas para Economía (5)" }));

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Idea 1 de 5")).toBeInTheDocument();
      expect(within(question("c2")).queryByRole("button", { name: /ideas para/i })).not.toBeInTheDocument();
    });

    describe("panel de progreso", () => {
      function progressPanel() {
        return screen.getByRole("complementary", { name: "Tu progreso" });
      }

      function progressItem(categoryName: string) {
        return within(progressPanel()).getByRole("button", { name: new RegExp(categoryName, "i") });
      }

      it("cuenta las respondidas y enseña el estado de cada categoría activa", async () => {
        stubFetch();
        renderPage();
        await waitUntilLoaded();

        expect(progressPanel()).toHaveTextContent("1 de 2 respondidas");
        expect(progressItem("economía")).toHaveTextContent(/guardada el 18 de septiembre/i);
        expect(progressItem("deporte")).toHaveTextContent(/sin responder/i);
        expect(within(progressPanel()).queryByRole("button", { name: /pareja/i })).not.toBeInTheDocument();
      });

      it("cambiar la puntuación de una categoría la marca 'sin guardar' y guardarla, 'guardada hoy'", async () => {
        stubFetch();
        renderPage();
        await waitUntilLoaded();

        chooseScore("economía", 4);
        expect(progressItem("economía")).toHaveTextContent(/sin guardar/i);

        fireEvent.click(saveButton("Economía"));

        await waitFor(() => expect(progressItem("economía")).toHaveTextContent(/guardada hoy/i));
      });

      it("es un acordeón, abierto por defecto, que conserva el resumen al plegarlo (UX-06)", async () => {
        stubFetch();
        renderPage();
        await waitUntilLoaded();

        const summary = within(progressPanel()).getByText("Tu progreso").closest("[aria-expanded]") as HTMLElement;
        expect(summary).toHaveAttribute("aria-expanded", "true");
        fireEvent.click(summary);

        expect(summary).toHaveAttribute("aria-expanded", "false");
        expect(summary).toHaveTextContent("1 de 2 respondidas");
      });

      it("tocar una categoría lleva a su pregunta", async () => {
        const scrollIntoView = vi.fn();
        Element.prototype.scrollIntoView = scrollIntoView;
        stubFetch();
        renderPage();
        await waitUntilLoaded();

        fireEvent.click(progressItem("deporte"));

        expect(scrollIntoView.mock.contexts[0]).toBe(question("c2"));
      });
    });

    it("el historial ya no está en la entrevista (pasa a Resultados)", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      expect(screen.queryByRole("complementary", { name: /historial/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ver mi historial/i })).not.toBeInTheDocument();
    });
  });

  describe("experiencias (RF-41)", () => {
    function helpsGroup(categoryName: string) {
      return screen.getByRole("group", { name: new RegExp(`qué te ayuda.*${categoryName}`, "i") });
    }

    it("'¿Qué te ayuda?' está plegado, cuenta lo marcado y al abrirlo enseña las opciones de esa categoría", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      const toggle = screen.getByRole("button", { name: "¿Qué te ayuda? (1)" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(toggle);

      const group = helpsGroup("economía");
      expect(within(group).getByRole("button", { name: "Llevar un presupuesto", pressed: true })).toBeInTheDocument();
      expect(within(group).getByRole("button", { name: "Apps de finanzas", pressed: false })).toBeInTheDocument();
      expect(within(group).queryByRole("button", { name: "Gimnasio" })).not.toBeInTheDocument();
    });

    it("marcar una opción se ve al instante y se guarda sin esperar a 'Guardar'", async () => {
      const fetchMock = stubFetch();
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));

      expect(await within(helpsGroup("economía")).findByRole("button", { name: "Apps de finanzas", pressed: true })).toBeInTheDocument();
      await waitFor(() => expect(postCalls(fetchMock, "/api/categories/experience")).toHaveLength(1));
      expect(JSON.parse(postCalls(fetchMock, "/api/categories/experience")[0][1].body as string)).toEqual({ categoryId: "c1", tags: ["economia.presupuesto", "economia.apps"] });
      expect(saveButton("Economía")).toBeDisabled();
    });

    it("cuando el servidor confirma la opción, las ideas personalizadas se vuelven a pedir (RF-40 v1.1)", async () => {
      // Si una idea se pidió mientras se guardaba la opción, se escribió con las opciones de antes.
      stubFetch();
      const client = createTestClient();
      client.setQueryData(["personalized-ideas", "r1", "economia.1", "es", "economia.apps|economia.presupuesto"], { source: "ai", templateKey: "economia.1", text: "Escrita antes de guardar la opción." });
      renderPage(client);
      await waitUntilLoaded();

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));

      await waitFor(() => expect(client.getQueryState(["personalized-ideas", "r1", "economia.1", "es", "economia.apps|economia.presupuesto"])?.isInvalidated).toBe(true));
    });

    it("una idea que se estaba pidiendo por primera vez mientras se guardaba la opción se vuelve a pedir al confirmarse (RF-40 v1.1)", async () => {
      // TanStack Query no repite una primera carga en curso al invalidarla: se engancha a ella (y esa lleva las opciones de antes).
      const fetchMock = stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      let confirmExperience: () => void = () => {};
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/accounts/session") return Promise.resolve({ ok: true, json: async () => ({ autenticado: true, email: "ana@ejemplo.com", aiIdeasAvailable: true }) });
        if (url === "/api/accounts/profile") return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiIdeasEnabled: true }) });
        if (url === "/api/recommendations/personalize") return new Promise(() => {}); // la primera carga se queda en curso
        if (url === "/api/categories/experience") {
          return new Promise((resolve) => {
            confirmExperience = () => resolve({ ok: true, json: async () => ({}) });
          });
        }
        return defaultImplementation(url, init);
      });
      render(
        withClient(
          <MemoryRouter>
            <SessionProvider>
              <InterviewPage />
            </SessionProvider>
          </MemoryRouter>,
        ),
      );
      await waitUntilLoaded();
      const personalizeCalls = () => fetchMock.mock.calls.filter(([urlCalled]) => urlCalled === "/api/recommendations/personalize").length;

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));
      fireEvent.click(await within(question("c1")).findByRole("button", { name: /^Ideas para Economía/ }));
      await waitFor(() => expect(personalizeCalls()).toBe(1));
      confirmExperience();

      await waitFor(() => expect(personalizeCalls()).toBe(2));
      // La petición de antes no solo se ignora: se aborta (AbortController de TanStack Query).
      const firstCall = fetchMock.mock.calls.find(([urlCalled]) => urlCalled === "/api/recommendations/personalize");
      expect((firstCall?.[1] as RequestInit).signal?.aborted).toBe(true);
    });

    it("si el servidor lo rechaza, la marca se deshace y se avisa", async () => {
      const fetchMock = stubFetch();
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      fetchMock.mockImplementation((url: string, init?: RequestInit) =>
        url === "/api/categories/experience" ? Promise.resolve({ ok: false, json: async () => ({ error: "Unknown option" }) }) : defaultImplementation(url, init),
      );
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));

      await waitFor(() => expect(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas", pressed: false })).toBeInTheDocument());
      expect(screen.getByText(/no se pudo guardar tu elección/i)).toBeInTheDocument();
    });

    it("las tres opciones de cada pregunta son desplegables y lo indican (aria-expanded)", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();
      chooseScore("economía", 3);

      for (const name of [/qué te ayuda/i, /qué te lo pone difícil/i, /tus experiencias/i]) {
        expect(within(question("c1")).getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
      }
    });

    it("'Tus experiencias' avisa de que solo las ve el usuario y nunca van a la IA", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(within(question("c1")).getByRole("button", { name: /tus experiencias/i }));

      expect(within(question("c1")).getByText("Solo las ves tú. Nunca se envían a la IA ni se comparten con nadie.")).toBeInTheDocument();
    });
  });

  describe("diario de experiencias (RF-44)", () => {
    function diary(categoryId: string) {
      return within(question(categoryId)).getByRole("list", { name: /tus experiencias/i });
    }

    it("enseña las 3 más recientes de cada categoría, con su fecha, y 'Ver todas (N)'", async () => {
      stubFetch({ experiences: EXPERIENCES });
      renderPage();
      await waitUntilLoaded();

      const items = within(await within(question("c1")).findByRole("list", { name: /tus experiencias/i })).getAllByRole("listitem");
      expect(items.map((item) => item.textContent)).toEqual([
        expect.stringMatching(/18 de septiembre de 2026.*Este mes he ahorrado un poco/),
        expect.stringMatching(/15 de enero de 2026.*Mes justo/),
        expect.stringMatching(/1 de diciembre de 2025.*Empecé a apuntar gastos/),
      ]);
      fireEvent.click(within(question("c1")).getByRole("button", { name: "Ver todas (4)" }));
      expect(within(diary("c1")).getAllByRole("listitem")).toHaveLength(4);
      expect(within(question("c2")).queryByRole("list", { name: /tus experiencias/i })).not.toBeInTheDocument();
    });

    it("'Añadir' guarda la experiencia al momento, sin puntuar: 'Guardada' y arriba de la lista; 'Guardar' no se activa", async () => {
      const fetchMock = stubFetch({ experiences: EXPERIENCES });
      renderPage();
      await waitUntilLoaded();
      fireEvent.click(within(question("c1")).getByRole("button", { name: /tus experiencias/i }));

      fireEvent.change(within(question("c1")).getByLabelText("Nueva experiencia"), { target: { value: "Hoy he cobrado" } });
      expect(saveButton("Economía")).toBeDisabled();
      fireEvent.click(within(question("c1")).getByRole("button", { name: "Añadir" }));

      expect(await within(question("c1")).findByRole("status")).toHaveTextContent("Guardada");
      expect(JSON.parse(postCalls(fetchMock, "/api/categories/diary")[0][1].body as string)).toEqual({ categoryId: "c1", text: "Hoy he cobrado" });
      expect(within(diary("c1")).getAllByRole("listitem")[0]).toHaveTextContent("Hoy he cobrado");
      expect(within(question("c1")).getByLabelText("Nueva experiencia")).toHaveValue("");
      expect(postCalls(fetchMock, "/api/assessments")).toHaveLength(0);
    });

    it("borrar pide confirmación y la quita de la lista", async () => {
      const fetchMock = stubFetch({ experiences: EXPERIENCES });
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(await within(question("c1")).findByRole("button", { name: "Borrar la experiencia del 15 de enero de 2026" }));
      const dialog = screen.getByRole("dialog", { name: /borrar esta experiencia/i });
      fireEvent.click(within(dialog).getByRole("button", { name: "Borrar" }));

      await waitFor(() => expect(within(diary("c1")).queryByText("Mes justo")).not.toBeInTheDocument());
      expect(fetchMock.mock.calls.some(([url, init]) => url === "/api/categories/diary?id=e2" && init?.method === "DELETE")).toBe(true);
    });

    it("RF-30: junto al diario, el enlace a las líneas de ayuda", async () => {
      stubFetch({ experiences: EXPERIENCES });
      renderPage();
      await waitUntilLoaded();

      expect(await within(question("c1")).findByRole("link", { name: "¿Necesitas ayuda ahora?" })).toHaveAttribute("href", "/ayuda");
    });

    it("la X del campo lo borra y lo cierra", async () => {
      stubFetch({ experiences: EXPERIENCES });
      renderPage();
      await waitUntilLoaded();
      fireEvent.click(within(question("c1")).getByRole("button", { name: /tus experiencias/i }));
      fireEvent.change(within(question("c1")).getByLabelText("Nueva experiencia"), { target: { value: "algo" } });

      fireEvent.click(within(question("c1")).getByRole("button", { name: "Borrar y cerrar" }));

      expect(within(question("c1")).queryByLabelText("Nueva experiencia")).not.toBeInTheDocument();
      expect(within(question("c1")).getByRole("button", { name: /tus experiencias/i })).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("compartir experiencias (RF-43)", () => {
    const HIGH_SCORES = [{ ...LATEST[0], score: 9 }, { ...LATEST[1], score: 9 }];
    const ONE_EXPERIENCE = [EXPERIENCES[0]];

    function experienceItem(text: string) {
      return within(question("c1")).getByText(text).closest("li") as HTMLElement;
    }

    function patchBodies(fetchMock: ReturnType<typeof stubFetch>) {
      return fetchMock.mock.calls.filter(([url, init]) => url === "/api/categories/diary" && init?.method === "PATCH").map(([, init]) => JSON.parse(init.body as string));
    }

    it("con 8 o más, la app lo ofrece; compartir enseña antes cómo la verán otras personas y, al confirmar, queda 'Compartida'", async () => {
      const fetchMock = stubFetch({ latest: HIGH_SCORES, experiences: ONE_EXPERIENCE });
      renderPage();
      await waitUntilLoaded();

      expect(await within(question("c1")).findByText(/puedes compartir una experiencia de forma anónima/i)).toBeInTheDocument();
      fireEvent.click(within(experienceItem("Este mes he ahorrado un poco")).getByRole("button", { name: "Compartir de forma anónima" }));
      const dialog = screen.getByRole("dialog", { name: "Compartir de forma anónima" });
      expect(within(dialog).getByText("Este mes he ahorrado un poco")).toBeInTheDocument();
      expect(within(dialog).getByText(/sin tu nombre, la fecha ni tu puntuación/i)).toBeInTheDocument();
      expect(patchBodies(fetchMock)).toHaveLength(0);
      fireEvent.click(within(dialog).getByRole("button", { name: "Compartir" }));

      expect(await within(experienceItem("Este mes he ahorrado un poco")).findByText("Compartida")).toBeInTheDocument();
      expect(patchBodies(fetchMock)).toEqual([{ id: "e3", shared: true, locale: "es" }]);
      // La ventana tarda un momento en cerrarse; mientras, el resto de la página no es accesible.
      expect(await within(experienceItem("Este mes he ahorrado un poco")).findByRole("button", { name: "Dejar de compartir" })).toBeInTheDocument();
    });

    it("con menos de 8, no se ofrece", async () => {
      stubFetch({ experiences: ONE_EXPERIENCE });
      renderPage();
      await waitUntilLoaded();
      await within(question("c1")).findByText("Este mes he ahorrado un poco");

      expect(within(question("c1")).queryByRole("button", { name: "Compartir de forma anónima" })).not.toBeInTheDocument();
      expect(within(question("c1")).queryByText(/puedes compartir una experiencia de forma anónima/i)).not.toBeInTheDocument();
    });

    it("nunca en una categoría sensible, aunque tenga 8 o más", async () => {
      stubFetch({ latest: HIGH_SCORES, experiences: [{ id: "e-sport", categoryId: "c2", text: "Correr los sábados", createdAt: "2026-09-01T10:00:00.000Z" }] });
      renderPage();
      await waitUntilLoaded();

      expect(await within(question("c2")).findByText("Correr los sábados")).toBeInTheDocument();
      expect(within(question("c2")).queryByRole("button", { name: "Compartir de forma anónima" })).not.toBeInTheDocument();
    });

    it("si no pasa los filtros, la ventana dice qué quitar y no se comparte", async () => {
      stubFetch({ latest: HIGH_SCORES, experiences: ONE_EXPERIENCE, shareRejection: "health" });
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(await within(question("c1")).findByRole("button", { name: "Compartir de forma anónima" }));
      const dialog = screen.getByRole("dialog", { name: "Compartir de forma anónima" });
      fireEvent.click(within(dialog).getByRole("button", { name: "Compartir" }));

      expect(await within(dialog).findByText(/salud, medicación, terapia o dinero/i)).toBeInTheDocument();
      expect(within(experienceItem("Este mes he ahorrado un poco")).queryByText("Compartida")).not.toBeInTheDocument();
    });

    it("'Dejar de compartir' la vuelve privada", async () => {
      const fetchMock = stubFetch({ latest: HIGH_SCORES, experiences: [{ ...EXPERIENCES[0], shared: true }] });
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(await within(question("c1")).findByRole("button", { name: "Dejar de compartir" }));

      expect(await within(experienceItem("Este mes he ahorrado un poco")).findByRole("button", { name: "Compartir de forma anónima" })).toBeInTheDocument();
      expect(within(experienceItem("Este mes he ahorrado un poco")).queryByText("Compartida")).not.toBeInTheDocument();
      expect(patchBodies(fetchMock)).toEqual([{ id: "e3", shared: false }]);
    });

    it("una retirada tras un reporte lo dice y no se puede volver a compartir", async () => {
      stubFetch({ latest: HIGH_SCORES, experiences: [{ ...EXPERIENCES[0], shared: false, reported: true }] });
      renderPage();
      await waitUntilLoaded();

      expect(await within(question("c1")).findByText("Retirada tras un reporte")).toBeInTheDocument();
      expect(within(question("c1")).queryByRole("button", { name: "Compartir de forma anónima" })).not.toBeInTheDocument();
    });
  });

  describe("sugerencias de la IA a partir de una experiencia (RF-45)", () => {
    function renderWithAi({ suggestionsEnabled, suggestion, experiences }: { suggestionsEnabled: boolean; suggestion?: unknown; experiences?: unknown[] }) {
      const fetchMock = stubFetch({ experiences: experiences ?? [...EXPERIENCES, { id: "e-sport", categoryId: "c2", text: "Me cuesta salir a correr", createdAt: "2026-09-01T10:00:00.000Z" }] });
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/accounts/session") return Promise.resolve({ ok: true, json: async () => ({ autenticado: true, email: "ana@ejemplo.com", aiIdeasAvailable: true }) });
        if (url === "/api/accounts/profile") return Promise.resolve({ ok: true, json: async () => ({ name: "Ana", aiSuggestionsEnabled: suggestionsEnabled }) });
        if (url === "/api/recommendations/suggest-options") return Promise.resolve({ ok: true, json: async () => suggestion ?? { helps: [], difficulties: [] } });
        return defaultImplementation(url, init);
      });
      render(
        withClient(
          <MemoryRouter>
            <SessionProvider>
              <InterviewPage />
            </SessionProvider>
          </MemoryRouter>,
        ),
      );
      return fetchMock;
    }

    function experienceItem(text: string) {
      return within(question("c1")).getByText(text).closest("li") as HTMLElement;
    }

    it("sin activarlas, ninguna experiencia ofrece sugerencias, pero el diario dice dónde activarlas", async () => {
      renderWithAi({ suggestionsEnabled: false });
      await waitUntilLoaded();
      await within(question("c1")).findByText("Mes justo");

      expect(screen.queryByRole("button", { name: "Sugerir opciones con IA" })).not.toBeInTheDocument();
      expect(await within(question("c1")).findByRole("link", { name: "Actívalas en Privacidad y datos" })).toHaveAttribute("href", "/perfil/datos");
      expect(within(question("c2")).queryByRole("link", { name: "Actívalas en Privacidad y datos" })).not.toBeInTheDocument();
    });

    it("Pareja está excluida de la IA: ni botón ni aviso, aunque estén activadas", async () => {
      renderWithAi({ suggestionsEnabled: true, experiences: [{ id: "e-pareja", categoryId: "c3", text: "Nos cuesta hablar", createdAt: "2026-09-01T10:00:00.000Z" }] });
      await waitUntilLoaded();
      toggleCategory("pareja");

      expect(await within(question("c3")).findByText("Nos cuesta hablar")).toBeInTheDocument();
      expect(within(question("c3")).queryByRole("button", { name: "Sugerir opciones con IA" })).not.toBeInTheDocument();
      expect(within(question("c3")).queryByRole("link", { name: "Actívalas en Privacidad y datos" })).not.toBeInTheDocument();
    });

    it("activadas, el aviso de dónde activarlas ya no sale", async () => {
      renderWithAi({ suggestionsEnabled: true });
      await waitUntilLoaded();
      await within(experienceItem("Mes justo")).findByRole("button", { name: "Sugerir opciones con IA" });

      expect(within(question("c1")).queryByRole("link", { name: "Actívalas en Privacidad y datos" })).not.toBeInTheDocument();
    });

    it("activadas, cada experiencia de una categoría no sensible lo ofrece (con el aviso sobre los nombres); las sensibles no", async () => {
      renderWithAi({ suggestionsEnabled: true });
      await waitUntilLoaded();

      expect(await within(experienceItem("Mes justo")).findByRole("button", { name: "Sugerir opciones con IA" })).toBeInTheDocument();
      expect(within(question("c1")).getAllByText(/no escribas nombres de otras personas/i).length).toBeGreaterThan(0);
      expect(within(question("c2")).queryByRole("button", { name: "Sugerir opciones con IA" })).not.toBeInTheDocument();
    });

    it("pide las sugerencias de esa experiencia y las enseña, de la IA, sin marcarlas todavía", async () => {
      const fetchMock = renderWithAi({ suggestionsEnabled: true, suggestion: { helps: ["economia.apps"], difficulties: ["mirarMisCuentas"] } });
      await waitUntilLoaded();

      fireEvent.click(await within(experienceItem("Mes justo")).findByRole("button", { name: "Sugerir opciones con IA" }));

      const item = experienceItem("Mes justo");
      expect(await within(item).findByText("La IA sugiere:")).toBeInTheDocument();
      expect(within(item).getByText("Sugerido por IA")).toBeInTheDocument();
      expect(within(item).getByRole("button", { name: "Marcar «Apps de finanzas»" })).toBeInTheDocument();
      expect(within(item).getByRole("button", { name: "Marcar «Mirar mis cuentas»" })).toBeInTheDocument();
      const body = JSON.parse(postCalls(fetchMock, "/api/recommendations/suggest-options")[0][1].body as string);
      expect(body).toEqual({ experienceId: "e2", locale: "es" });
      expect(postCalls(fetchMock, "/api/categories/difficulties")).toHaveLength(0);
    });

    it("aceptar una la marca como si la tocara el usuario; descartar otra solo la quita", async () => {
      const fetchMock = renderWithAi({ suggestionsEnabled: true, suggestion: { helps: ["economia.apps"], difficulties: ["mirarMisCuentas"] } });
      await waitUntilLoaded();
      fireEvent.click(await within(experienceItem("Mes justo")).findByRole("button", { name: "Sugerir opciones con IA" }));
      const item = experienceItem("Mes justo");

      fireEvent.click(await within(item).findByRole("button", { name: "Marcar «Mirar mis cuentas»" }));
      fireEvent.click(within(item).getByRole("button", { name: "Descartar «Apps de finanzas»" }));

      await waitFor(() => expect(postCalls(fetchMock, "/api/categories/difficulties")).toHaveLength(1));
      expect(JSON.parse(postCalls(fetchMock, "/api/categories/difficulties")[0][1].body as string)).toEqual({ categoryId: "c1", tags: ["mirarMisCuentas"] });
      expect(postCalls(fetchMock, "/api/categories/experience")).toHaveLength(0);
      expect(within(item).queryByRole("button", { name: /Mirar mis cuentas|Apps de finanzas/ })).not.toBeInTheDocument();
    });

    it("con palabras ofensivas, avisa antes de enviar nada; 'Cancelar' no envía y 'Enviar igualmente' sí", async () => {
      const fetchMock = renderWithAi({ suggestionsEnabled: true, experiences: [{ id: "e-mal", categoryId: "c1", text: "Mi jefe es un gilipollas y no me sube el sueldo", createdAt: "2026-09-01T10:00:00.000Z" }] });
      await waitUntilLoaded();
      const item = () => experienceItem("Mi jefe es un gilipollas y no me sube el sueldo");

      fireEvent.click(await within(item()).findByRole("button", { name: "Sugerir opciones con IA" }));
      expect(within(item()).getByText(/tiene palabras que preferimos no enviar a la ia/i)).toBeInTheDocument();
      expect(postCalls(fetchMock, "/api/recommendations/suggest-options")).toHaveLength(0);

      fireEvent.click(within(item()).getByRole("button", { name: "Cancelar" }));
      expect(within(item()).getByRole("button", { name: "Sugerir opciones con IA" })).toBeInTheDocument();
      expect(postCalls(fetchMock, "/api/recommendations/suggest-options")).toHaveLength(0);

      fireEvent.click(within(item()).getByRole("button", { name: "Sugerir opciones con IA" }));
      fireEvent.click(within(item()).getByRole("button", { name: "Enviar igualmente" }));
      await waitFor(() => expect(postCalls(fetchMock, "/api/recommendations/suggest-options")).toHaveLength(1));
    });

    it("si no hay nada que proponer, lo dice", async () => {
      renderWithAi({ suggestionsEnabled: true });
      await waitUntilLoaded();

      fireEvent.click(await within(experienceItem("Mes justo")).findByRole("button", { name: "Sugerir opciones con IA" }));

      expect(await within(experienceItem("Mes justo")).findByText("No hemos encontrado opciones en esta experiencia.")).toBeInTheDocument();
    });
  });

  describe("¿Qué te lo pone difícil? (RF-42)", () => {
    function difficultiesToggle(categoryId: string) {
      return within(question(categoryId)).queryByRole("button", { name: /qué te lo pone difícil/i });
    }

    it("con una puntuación alta y sin idea abierta no se pregunta", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      expect(difficultiesToggle("c1")).not.toBeInTheDocument();
    });

    it("con una puntuación baja aparece, plegado, con las situaciones de esa categoría", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      chooseScore("economía", 3);
      const toggle = difficultiesToggle("c1")!;
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(toggle);

      const group = within(question("c1")).getByRole("group", { name: /qué te lo pone difícil/i });
      expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual(["Hablar de lo que siento o me preocupa", "Apuntar cosas o llevar registros", "Mirar mis cuentas"]);
    });

    it("con una idea abierta también aparece, aunque la puntuación ya no sea baja", async () => {
      stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
      renderPage();
      await waitUntilLoaded();

      expect(await within(question("c1")).findByRole("button", { name: /qué te lo pone difícil/i })).toBeInTheDocument();
    });

    it("marcar una situación se ve al momento y se guarda", async () => {
      const fetchMock = stubFetch();
      renderPage();
      await waitUntilLoaded();
      chooseScore("economía", 3);
      fireEvent.click(difficultiesToggle("c1")!);

      fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

      expect(await within(question("c1")).findByRole("button", { name: "Mirar mis cuentas", pressed: true })).toBeInTheDocument();
      await waitFor(() => expect(postCalls(fetchMock, "/api/categories/difficulties")).toHaveLength(1));
      expect(JSON.parse(postCalls(fetchMock, "/api/categories/difficulties")[0][1].body as string)).toEqual({ categoryId: "c1", tags: ["mirarMisCuentas"] });
    });

    describe("reacción al marcar", () => {
      it("con idea abierta: 'Ideas actualizadas', y el botón de ideas dice cuántas quedan y da un pulso", async () => {
        stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
        renderPage();
        await waitUntilLoaded();
        const ideasButton = await within(question("c1")).findByRole("button", { name: "Ideas para Economía (5)" });
        expect(ideasButton).not.toHaveAttribute("data-pulse");
        fireEvent.click(difficultiesToggle("c1")!);

        fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

        expect(await within(question("c1")).findByRole("status")).toHaveTextContent("Ideas actualizadas");
        expect(within(question("c1")).getByRole("button", { name: "Ideas para Economía (4)" })).toHaveAttribute("data-pulse", "true");
      });

      it("sin idea abierta: 'Para tus próximas ideas'", async () => {
        stubFetch();
        renderPage();
        await waitUntilLoaded();
        chooseScore("economía", 3);
        fireEvent.click(difficultiesToggle("c1")!);

        fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

        expect(await within(question("c1")).findByRole("status")).toHaveTextContent("Para tus próximas ideas");
      });

      it("'¿Qué te ayuda?' sin IA: el mismo pulso en las ideas, pero el texto solo dice 'Guardado' (no promete un cambio)", async () => {
        stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
        renderPage();
        await waitUntilLoaded();
        await within(question("c1")).findByRole("button", { name: /^Ideas para Economía/ });
        fireEvent.click(within(question("c1")).getByRole("button", { name: /qué te ayuda/i }));

        fireEvent.click(within(question("c1")).getByRole("button", { name: "Apps de finanzas" }));

        const status = await within(question("c1")).findByRole("status");
        expect(status.textContent?.trim()).toBe("Guardado");
        expect(within(question("c1")).getByRole("button", { name: /^Ideas para Economía/ })).toHaveAttribute("data-pulse", "true");
      });

      it("en pantallas anchas, el mensaje sale a la derecha del título de su lista, en la misma línea (no hace saltar nada al irse)", async () => {
        // jsdom no evalúa media queries: se simula una pantalla ancha.
        vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("min-width"), media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false }));
        stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
        renderPage();
        await waitUntilLoaded();
        fireEvent.click(difficultiesToggle("c1")!);

        fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

        const status = await within(question("c1")).findByRole("status");
        expect(status).toBeVisible();
        expect(status.parentElement).toBe(difficultiesToggle("c1")!.parentElement);
        vi.unstubAllGlobals();
      });

      it("en móvil (no cabe al lado), el título enseña la confirmación un momento y conserva su nombre", async () => {
        stubFetch({ recommendations: [LOW_ECONOMY_IDEA] });
        renderPage();
        await waitUntilLoaded();
        fireEvent.click(difficultiesToggle("c1")!);

        fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

        expect(await within(question("c1")).findByRole("status")).toHaveTextContent("Ideas actualizadas");
        const toggle = difficultiesToggle("c1")!;
        expect(toggle).toHaveAccessibleName(/qué te lo pone difícil/i);
        expect(within(toggle).getByText("Ideas actualizadas")).toBeInTheDocument();
      });
    });

    it("si el servidor lo rechaza, la marca se deshace y se avisa", async () => {
      const fetchMock = stubFetch();
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      fetchMock.mockImplementation((url: string, init?: RequestInit) =>
        url === "/api/categories/difficulties" ? Promise.resolve({ ok: false, json: async () => ({ error: "Unknown situation" }) }) : defaultImplementation(url, init),
      );
      renderPage();
      await waitUntilLoaded();
      chooseScore("economía", 3);
      fireEvent.click(difficultiesToggle("c1")!);

      fireEvent.click(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas" }));

      expect(await screen.findByText(/no se pudo guardar tu elección/i)).toBeInTheDocument();
      expect(within(question("c1")).getByRole("button", { name: "Mirar mis cuentas", pressed: false })).toBeInTheDocument();
    });
  });

  it("marcar una categoría inactiva no sensible la activa y muestra su pregunta", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await waitUntilLoaded();

    toggleCategory("pareja");

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked());
    expect(postCalls(fetchMock, "/api/categories/activate")).toHaveLength(1);
    expect(screen.getByRole("group", { name: /pareja/i })).toBeInTheDocument();
  });

  it("una categoría recién añadida sale la primera, con su animación de entrada; las de antes, sin ella", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    toggleCategory("pareja");

    await waitFor(() => expect(document.querySelectorAll('[id^="pregunta-"]')[0]).toHaveAttribute("id", "pregunta-c3"));
    expect(question("c3")).toHaveAttribute("data-just-added", "true");
    expect(question("c1")).not.toHaveAttribute("data-just-added");
    expect(within(screen.getByRole("navigation", { name: /ir a una categoría/i })).getAllByRole("link")[0]).toHaveTextContent(/pareja/i);
  });

  it("las preguntas van en su propio bloque, separado de la introducción, con su título", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    expect(screen.getByRole("heading", { level: 2, name: "¿Cómo te sientes en cada una?" })).toBeInTheDocument();
  });

  describe("reactivar una categoría con puntuaciones guardadas (UX-06)", () => {
    it("vuelve al instante con su última puntuación, sin pasar por 'sin responder'", async () => {
      // Como el servidor: las últimas puntuaciones solo traen las categorías activas.
      let economyActive = true;
      const fetchMock = stubFetch({ latest: () => (economyActive ? LATEST : LATEST.filter((latestScore) => latestScore.categoryId !== "c1")) });
      renderPage();
      await waitUntilLoaded();
      const latestCalls = () => fetchMock.mock.calls.filter(([urlCalled, init]) => urlCalled === "/api/assessments" && !init?.method).length;
      const callsBefore = latestCalls();

      economyActive = false;
      toggleCategory("economía");
      await waitFor(() => expect(latestCalls()).toBeGreaterThan(callsBefore));
      await waitFor(() => expect(screen.queryByRole("group", { name: /puntuación de economía/i })).not.toBeInTheDocument());
      economyActive = true;
      toggleCategory("economía");

      const group = screen.getByRole("group", { name: /puntuación de economía/i });
      expect(within(group).getByRole("button", { name: "6" })).toHaveAttribute("aria-pressed", "true");
      expect(within(question("c1")).queryByText(/sin responder/i)).not.toBeInTheDocument();
    });

    it("una categoría que ya venía desactivada recupera al instante la puntuación de su historial", async () => {
      stubFetch({
        history: [...HISTORY, { recordedAt: "2026-08-01T10:00:00.000Z", entries: [{ categoryId: "c3", catalogId: "k-pareja", categoryName: "Pareja", score: 7 }] }],
      });
      renderPage();
      await waitUntilLoaded();
      await waitFor(() => expect(screen.getAllByText(/última actualización/i).length).toBeGreaterThan(0));

      toggleCategory("pareja");

      const group = screen.getByRole("group", { name: /puntuación de pareja/i });
      expect(within(group).getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("desmarcar una categoría activa la desactiva y quita su pregunta", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await waitUntilLoaded();

    toggleCategory("economía");

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).not.toBeChecked());
    expect(postCalls(fetchMock, "/api/categories/deactivate")).toHaveLength(1);
    expect(screen.queryByRole("group", { name: /economía/i })).not.toBeInTheDocument();
  });

  it("una categoría sensible pide consentimiento (con enlace a la política) y se activa al aceptar", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    toggleCategory("sexo");

    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /leer la política de privacidad/i })).toHaveAttribute("href", "/politica-privacidad");
    fireEvent.click(screen.getByRole("button", { name: /aceptar y activar/i }));

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /sexo/i })).toBeChecked());
    expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument();
  });

  it("cancelar el consentimiento deja la categoría sin activar", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    toggleCategory("sexo");
    await waitFor(() => expect(screen.getByText(/se necesita tu consentimiento/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: /sexo/i })).not.toBeChecked();
  });

  it("las categorías sensibles van en una columna aparte, con la explicación del consentimiento", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const sensitiveColumn = screen.getByRole("group", { name: /requieren tu consentimiento/i });
    expect(within(sensitiveColumn).getByRole("checkbox", { name: /sexo/i })).toBeInTheDocument();
    expect(within(sensitiveColumn).getByRole("checkbox", { name: /deporte/i })).toBeInTheDocument();
    expect(within(sensitiveColumn).queryByRole("checkbox", { name: /pareja/i })).not.toBeInTheDocument();
    expect(within(sensitiveColumn).getByText(/datos sensibles/i)).toBeInTheDocument();
  });

  it("'Seleccionar todas' afecta solo a la columna sin consentimiento", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const selectAll = screen.getByRole("checkbox", { name: /seleccionar todas/i });
    expect(selectAll).toHaveAttribute("data-indeterminate", "true");
    fireEvent.click(selectAll);

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked());
    expect(selectAll).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /sexo/i })).not.toBeChecked();
    expect(screen.queryByText(/se necesita tu consentimiento/i)).not.toBeInTheDocument();

    fireEvent.click(selectAll);
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /economía/i })).not.toBeChecked());
    expect(screen.getByRole("checkbox", { name: /pareja/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /deporte/i })).toBeChecked();
  });

  it("junto a cada pregunta hay un icono que despliega y oculta ejemplos", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const info = screen.getByRole("button", { name: /ver ejemplos de economía/i });
    expect(info).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(info);

    expect(info).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/salario/i)).toBeVisible();
  });

  it("la respuesta recibe un fondo suave según la banda (sin colorear el número)", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const group = screen.getByRole("group", { name: /economía/i });
    expect(group.closest("[data-band]")).toHaveAttribute("data-band", "medium");
    chooseScore("economía", 2);
    expect(group.closest("[data-band]")).toHaveAttribute("data-band", "low");
  });

  it("marcar una categoría no sensible se refleja al instante, sin esperar al servidor", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    const fetchMock = stubFetch();
    const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      url === "/api/categories/activate"
        ? new Promise((resolve) => {
            resolveRequest = resolve;
          })
        : defaultImplementation(url, init),
    );
    renderPage();
    await waitUntilLoaded();

    toggleCategory("pareja");

    expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked();
    expect(screen.getByRole("group", { name: /pareja/i })).toBeInTheDocument();
    resolveRequest({ ok: true, json: async () => ({ ...CATEGORIES[2], status: "active" }) });
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked());
  });

  it("si el servidor rechaza el cambio optimista, se deshace y se avisa", async () => {
    const fetchMock = stubFetch();
    const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      url === "/api/categories/activate"
        ? Promise.resolve({ ok: false, json: async () => ({ error: "No se pudo activar" }) })
        : defaultImplementation(url, init),
    );
    renderPage();
    await waitUntilLoaded();

    toggleCategory("pareja");
    expect(screen.getByRole("checkbox", { name: /pareja/i })).toBeChecked();

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /pareja/i })).not.toBeChecked());
    expect(screen.getByText(/no se pudo activar/i)).toBeInTheDocument();
  });

  it("una categoría sensible muestra que está trabajando hasta que el servidor responde", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    const fetchMock = stubFetch();
    const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      url === "/api/categories/activate"
        ? new Promise((resolve) => {
            resolveRequest = resolve;
          })
        : defaultImplementation(url, init),
    );
    renderPage();
    await waitUntilLoaded();

    toggleCategory("sexo");

    expect(screen.getByRole("progressbar", { name: /sexo/i })).toBeInTheDocument();
    resolveRequest({ ok: true, json: async () => ({ ...CATEGORIES[3], status: "active" }) });
    await waitFor(() => expect(screen.queryByRole("progressbar", { name: /sexo/i })).not.toBeInTheDocument());
  });

  it("al volver a la pantalla usa la caché: no repite las llamadas de lectura", async () => {
    const fetchMock = stubFetch();
    const client = createTestClient();
    const firstRender = renderPage(client);
    await waitUntilLoaded();
    firstRender.unmount();

    renderPage(client);

    // Sin esperar: la pantalla sale ya pintada con lo de la caché, sin el indicador de carga.
    expect(screen.getByRole("heading", { level: 1, name: /actualiza tus respuestas/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([urlCalled]) => urlCalled === "/api/categories")).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([urlCalled, i]) => urlCalled === "/api/assessments" && !i?.method)).toHaveLength(1);
  });

  it("las categorías activas sin responder llevan una marca en su pregunta y en el acceso directo, que desaparece al contestar", async () => {
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const shortcuts = screen.getByRole("navigation", { name: /ir a una categoría/i });
    expect(within(shortcuts).getByRole("link", { name: /deporte/i })).toHaveTextContent(/sin responder/i);
    expect(within(shortcuts).getByRole("link", { name: /economía/i })).not.toHaveTextContent(/sin responder/i);
    const sportQuestion = document.getElementById("pregunta-c2")!;
    expect(within(sportQuestion).getByText(/sin responder/i)).toBeInTheDocument();
    expect(within(document.getElementById("pregunta-c1")!).queryByText(/sin responder/i)).not.toBeInTheDocument();

    chooseScore("deporte", 7);

    expect(within(shortcuts).getByRole("link", { name: /deporte/i })).not.toHaveTextContent(/sin responder/i);
    expect(within(sportQuestion).queryByText(/sin responder/i)).not.toBeInTheDocument();
  });

  it("el acceso directo lleva a la pregunta de esa categoría", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    stubFetch();
    renderPage();
    await waitUntilLoaded();

    const link = within(screen.getByRole("navigation", { name: /ir a una categoría/i })).getByRole("link", { name: /deporte/i });
    expect(link).toHaveAttribute("href", "#pregunta-c2");
    fireEvent.click(link);

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("pregunta-c2"));
  });

  it("la primera vez es una entrevista; con respuestas guardadas se presenta como actualizarlas", async () => {
    stubFetch({ latest: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía" }, { categoryId: "c2", catalogId: "k-deporte", categoryName: "Deporte" }] });
    const firstRender = renderPage();
    expect(await screen.findByRole("heading", { level: 1, name: /tu entrevista/i })).toBeInTheDocument();
    firstRender.unmount();

    stubFetch();
    renderPage();
    expect(await screen.findByRole("heading", { level: 1, name: /actualiza tus respuestas/i })).toBeInTheDocument();
  });

  it("la primera vez, el entrevistador explica los pasos de la pantalla con el nombre real del botón (UX-01)", async () => {
    stubFetch({ latest: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía" }] });
    renderPage();

    const steps = await screen.findByRole("list", { name: /qué vamos a hacer/i });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    expect(steps).toHaveTextContent(/pulsa «guardar»/i);
  });

  it("al actualizar respuestas no repite los pasos (UX-01)", async () => {
    stubFetch();
    renderPage();

    await screen.findByRole("heading", { level: 1, name: /actualiza tus respuestas/i });
    expect(screen.queryByRole("list", { name: /qué vamos a hacer/i })).not.toBeInTheDocument();
  });

  it("en inglés, los nombres y descripciones de las categorías estándar salen traducidos (RNF-10)", async () => {
    await i18n.changeLanguage("en");
    try {
      stubFetch();
      renderPage();

      await screen.findByRole("heading", { level: 1 });
      openCategoryAccordions();
      expect(await screen.findByRole("checkbox", { name: /finances/i })).toBeInTheDocument();
      expect(screen.getByText("How are you feeling about Finances?")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Score for Finances" })).toBeInTheDocument();
      expect(screen.queryByText(/economía/i)).not.toBeInTheDocument();
      // Los ejemplos siguen funcionando: se buscan por el nombre guardado, no por el traducido.
      expect(screen.getByRole("button", { name: /see examples for finances/i })).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("es");
    }
  });

  it("en inglés, una categoría creada por el admin se nombra igual que las estándar: por su id, con su traducción", async () => {
    await i18n.changeLanguage("en");
    try {
      const fetchMock = stubFetch();
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      const creativity = { catalogId: "k-creatividad", translations: { es: { name: "Creatividad", description: "Arte y hobbies." }, en: { name: "Creativity", description: "Art and hobbies." } } };
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/categories") {
          return Promise.resolve({ ok: true, json: async () => [...CATEGORIES, { id: "c9", catalogId: "k-creatividad", name: "Creatividad", description: "Arte y hobbies.", status: "active", isSensitiveData: false }] });
        }
        if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture([creativity]) });
        return defaultImplementation(url, init);
      });
      renderPage();

      expect(await screen.findByText("How are you feeling about Creativity?")).toBeInTheDocument();
      expect(screen.getByText("Art and hobbies.")).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("es");
    }
  });
});
