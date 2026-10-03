// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { InterviewPage } from "@modules/assessments/ui/InterviewPage";
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

interface StubOptions {
  latest?: unknown;
  history?: unknown;
  recommendations?: unknown;
  /** Lo que devuelve /api/recommendations después de guardar (por defecto, lo mismo que antes). */
  recommendationsAfterSave?: unknown;
  saveResponse?: () => Promise<unknown>;
}

function stubFetch({ latest = LATEST, history = HISTORY, recommendations = [], recommendationsAfterSave, saveResponse }: StubOptions = {}) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/categories") return Promise.resolve({ ok: true, json: async () => CATEGORIES });
    if (url === "/api/categories/translations") return Promise.resolve({ ok: true, json: async () => categoryLabelsFixture() });
    if (url === "/api/assessments/history") return Promise.resolve({ ok: true, json: async () => history });
    if (url === "/api/recommendations") {
      const saved = fetchMock.mock.calls.some(([urlCalled, initCalled]) => urlCalled === "/api/assessments" && initCalled?.method === "POST");
      return Promise.resolve({ ok: true, json: async () => (saved && recommendationsAfterSave !== undefined ? recommendationsAfterSave : recommendations) });
    }
    if (url === "/api/assessments" && (!init || !init.method || init.method === "GET")) {
      return Promise.resolve({ ok: true, json: async () => latest });
    }
    if (url === "/api/categories/activate") {
      const { categoryId } = JSON.parse(init?.body as string);
      const category = CATEGORIES.find((category) => category.id === categoryId);
      if (category?.isSensitiveData && !fetchMock.mock.calls.some(([urlCalled]) => urlCalled === "/api/consent/grant")) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "Requiere consentimiento", code: "CONSENT_REQUIRED" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...category, status: "active" }) });
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
    if (url === "/api/assessments") return saveResponse ? saveResponse() : Promise.resolve({ ok: true, json: async () => ({ recorded: 1 }) });
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

async function waitUntilLoaded() {
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

  it("se puede puntuar por primera vez una categoría sin puntuación previa, con su experiencia privada", async () => {
    const fetchMock = stubFetch();
    renderPage();
    await waitUntilLoaded();

    chooseScore("deporte", 8);
    fireEvent.click(screen.getAllByRole("button", { name: /tu experiencia \(privada\)/i })[1]);
    fireEvent.change(screen.getByLabelText(/tu experiencia \(privada\)/i), { target: { value: "voy al gimnasio" } });
    fireEvent.click(saveButton("Deporte"));

    expect(await within(question("c2")).findByRole("status")).toHaveTextContent(/guardado ahora/i);
    expect(screen.queryByLabelText(/tu experiencia \(privada\)/i)).not.toBeInTheDocument();
    const [call] = postCalls(fetchMock, "/api/assessments");
    expect(JSON.parse(call[1].body as string)).toEqual({ entries: [{ categoryId: "c2", score: 8, note: "voy al gimnasio" }] });
  });

  describe("respuesta inmediata (UX-05)", () => {
    it("bajo su pregunta se ve la última actualización (fecha y cambio) y la última experiencia, como privada", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      const box = (await within(question("c1")).findByText(/última actualización/i)).closest("[data-last-update]") as HTMLElement;
      expect(box).toHaveTextContent("Última actualización: 18 de septiembre de 2026 · 6 → 4");
      expect(box).toHaveTextContent(/tu última experiencia \(privada\)/i);
      expect(box).toHaveTextContent(/este mes he ahorrado un poco/i);
      expect(screen.queryByText(/mes justo/i)).not.toBeInTheDocument();
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

      fireEvent.click(await within(question("c1")).findByRole("button", { name: "Ideas para Economía" }));

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

      it("cambiar una categoría la marca 'sin guardar' (también al escribir su experiencia) y guardarla, 'guardada hoy'", async () => {
        stubFetch();
        renderPage();
        await waitUntilLoaded();

        fireEvent.click(within(question("c1")).getByRole("button", { name: /tu experiencia \(privada\)/i }));
        fireEvent.change(within(question("c1")).getByLabelText(/tu experiencia \(privada\)/i), { target: { value: "algo" } });
        expect(progressItem("economía")).toHaveTextContent(/sin guardar/i);
        fireEvent.change(within(question("c1")).getByLabelText(/tu experiencia \(privada\)/i), { target: { value: "" } });
        chooseScore("economía", 4);
        expect(progressItem("economía")).toHaveTextContent(/sin guardar/i);

        fireEvent.click(saveButton("Economía"));

        await waitFor(() => expect(progressItem("economía")).toHaveTextContent(/guardada hoy/i));
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

      const toggle = screen.getByRole("button", { name: "¿Qué te ayuda en esta área? (1)" });
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

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda en esta área\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));

      expect(await within(helpsGroup("economía")).findByRole("button", { name: "Apps de finanzas", pressed: true })).toBeInTheDocument();
      await waitFor(() => expect(postCalls(fetchMock, "/api/categories/experience")).toHaveLength(1));
      expect(JSON.parse(postCalls(fetchMock, "/api/categories/experience")[0][1].body as string)).toEqual({ categoryId: "c1", tags: ["economia.presupuesto", "economia.apps"] });
      expect(saveButton("Economía")).toBeDisabled();
    });

    it("si el servidor lo rechaza, la marca se deshace y se avisa", async () => {
      const fetchMock = stubFetch();
      const defaultImplementation = fetchMock.getMockImplementation() as (url: string, init?: RequestInit) => Promise<unknown>;
      fetchMock.mockImplementation((url: string, init?: RequestInit) =>
        url === "/api/categories/experience" ? Promise.resolve({ ok: false, json: async () => ({ error: "Unknown option" }) }) : defaultImplementation(url, init),
      );
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(screen.getByRole("button", { name: /qué te ayuda en esta área\? \(1\)/i }));
      fireEvent.click(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas" }));

      await waitFor(() => expect(within(helpsGroup("economía")).getByRole("button", { name: "Apps de finanzas", pressed: false })).toBeInTheDocument());
      expect(screen.getByText(/no se pudo guardar tu elección/i)).toBeInTheDocument();
    });

    it("'Tu experiencia (privada)' avisa de que solo la ve el usuario y nunca va a la IA", async () => {
      stubFetch();
      renderPage();
      await waitUntilLoaded();

      fireEvent.click(screen.getAllByRole("button", { name: /tu experiencia \(privada\)/i })[0]);

      expect(screen.getByText("Solo la ves tú. Nunca se envía a la IA ni se comparte con nadie.")).toBeInTheDocument();
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

    expect(screen.getByRole("checkbox", { name: /economía/i })).toBeInTheDocument();
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
