// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { GENERAL_TEMPLATE_KEYS, templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";
import { STANDARD_CATEGORIES } from "@modules/categories/domain/standardCategories";
import { createTestClient, withClient } from "../../../helpers/queryClient";

describe("RecommendationButton (RF-18)", () => {
  it("se ve un botón destacado 'Una idea para ti', pero el texto de la idea no se muestra hasta pulsarlo", () => {
    render(<RecommendationButton templateKey="economia.1" categoryName="Economía" />);

    const button = screen.getByRole("button", { name: /una idea para ti/i });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("data-highlighted", "true");
    expect(screen.queryByText(/en qué se va tu dinero/i)).not.toBeInTheDocument();
  });

  it("al pulsarlo abre una ventana con la idea, la categoría y el aviso de RES-05; y se puede cerrar", async () => {
    render(<RecommendationButton templateKey="economia.1" categoryName="Economía" />);

    fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

    const dialog = screen.getByRole("dialog", { name: /economía/i });
    expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /cerrar/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("las plantillas generales incluyen el nombre de la categoría", () => {
    render(<RecommendationButton templateKey="general.1" categoryName="Creatividad" />);

    fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

    expect(within(screen.getByRole("dialog")).getByText(/creatividad/i, { selector: "p" })).toBeInTheDocument();
  });

  it("todas las plantillas del catálogo tienen texto en español e inglés (nunca se muestra una clave a pelo)", () => {
    // Por clave de categoría (antes se pasaban nombres y solo se comprobaban las generales).
    const keys = [...new Set([...STANDARD_CATEGORIES.flatMap(({ key }) => templateKeysFor(key)), ...GENERAL_TEMPLATE_KEYS])];
    expect(keys.length).toBe(9 * 5 + GENERAL_TEMPLATE_KEYS.length);
    for (const language of ["es", "en"]) {
      for (const key of keys) {
        const text = i18n.t(`recomendaciones.plantillas.${key}`, { lng: language, categoria: "X" });
        expect(text, `${language}:${key}`).not.toContain("recomendaciones.plantillas");
        expect(text.length).toBeGreaterThan(20);
      }
    }
  });

  it("muestra el nombre que recibe, ya en el idioma de la interfaz (la página lo resuelve por id), también dentro de la idea general", () => {
    render(<RecommendationButton templateKey="general.1" categoryName="Creativity" />);

    fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

    const dialog = screen.getByRole("dialog", { name: "Una idea para Creativity" });
    expect(within(dialog).getByText(/creativity/i, { selector: "p" })).toBeInTheDocument();
  });

  describe("carrusel de ideas (UX-05)", () => {
    function open() {
      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));
      return screen.getByRole("dialog");
    }

    it("enseña las 5 ideas de su categoría, primero la recomendada, con su posición y el aviso siempre", () => {
      render(<RecommendationButton templateKey="economia.3" categoryName="Economía" />);

      const dialog = open();
      expect(within(dialog).getByText(/un gasto pequeño y repetido/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Idea 1 de 5")).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole("button", { name: "Idea siguiente" }));
      expect(within(dialog).getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(within(dialog).queryByText(/un gasto pequeño y repetido/i)).not.toBeInTheDocument();
      expect(within(dialog).getByText("Idea 2 de 5")).toBeInTheDocument();
      expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
    });

    it("'anterior' desde la primera vuelve a la última", () => {
      render(<RecommendationButton templateKey="economia.1" categoryName="Economía" />);

      const dialog = open();
      fireEvent.click(within(dialog).getByRole("button", { name: "Idea anterior" }));

      expect(within(dialog).getByText(/hablar de dinero te ayuda/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Idea 5 de 5")).toBeInTheDocument();
    });

    it("una categoría sin ideas propias recorre las generales", () => {
      render(<RecommendationButton templateKey="general.2" categoryName="Creatividad" />);

      const dialog = open();
      expect(within(dialog).getByText("Idea 1 de 3")).toBeInTheDocument();
      expect(within(dialog).getByText(/lo que más te pesa de creatividad/i)).toBeInTheDocument();
    });
  });

  describe("ideas personalizadas (RF-40)", () => {
    afterEach(() => vi.unstubAllGlobals());

    function stubPersonalize(response: () => Promise<unknown>) {
      const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url) => (url === "/api/recommendations/personalize" ? response() : Promise.resolve({ ok: true, json: async () => ({}) })));
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    }

    function renderPersonalized(client = createTestClient()) {
      return render(withClient(<RecommendationButton recommendationId="r1" categoryId="c1" templateKey="economia.1" categoryName="Economía" personalize />, client));
    }

    function personalizeBodies(fetchMock: ReturnType<typeof stubPersonalize>) {
      return fetchMock.mock.calls.filter(([url]) => url === "/api/recommendations/personalize").map(([, init]) => JSON.parse(init?.body as string));
    }

    it("al abrirla pide la idea personalizada y la muestra con su etiqueta, la original a un clic y el aviso", async () => {
      const fetchMock = stubPersonalize(async () => ({ ok: true, json: async () => ({ source: "ai", templateKey: "economia.1", text: "Ya que te ayuda llevar un presupuesto: anota una semana en qué se va tu dinero." }) }));
      renderPersonalized();

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

      const dialog = screen.getByRole("dialog");
      expect(await within(dialog).findByText(/ya que te ayuda llevar un presupuesto/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Personalizada con IA")).toBeInTheDocument();
      expect(within(dialog).getByText(/no sustituyen el asesoramiento/i)).toBeInTheDocument();
      expect(personalizeBodies(fetchMock)).toEqual([{ recommendationId: "r1", templateKey: "economia.1", locale: "es" }]);

      fireEvent.click(within(dialog).getByRole("button", { name: "Ver la idea original" }));
      expect(within(dialog).getByText(/si te apetece, anota durante una semana/i)).toBeInTheDocument();
    });

    it("si el servidor devuelve la plantilla curada, se ve como siempre, sin etiqueta de IA", async () => {
      stubPersonalize(async () => ({ ok: true, json: async () => ({ source: "catalog", templateKey: "economia.1" }) }));
      renderPersonalized();

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

      const dialog = screen.getByRole("dialog");
      expect(await within(dialog).findByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(within(dialog).queryByText("Personalizada con IA")).not.toBeInTheDocument();
    });

    it("si la petición falla, se ve la idea curada, sin error", async () => {
      stubPersonalize(async () => ({ ok: false, json: async () => ({ error: "caído" }) }));
      renderPersonalized();

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));

      expect(await within(screen.getByRole("dialog")).findByText(/en qué se va tu dinero/i)).toBeInTheDocument();
      expect(screen.queryByText(/caído/i)).not.toBeInTheDocument();
    });

    it("volver a abrirla usa la caché: no repite la petición", async () => {
      const fetchMock = stubPersonalize(async () => ({ ok: true, json: async () => ({ source: "ai", templateKey: "economia.1", text: "Una idea personalizada con la longitud suficiente para pasar." }) }));
      renderPersonalized();

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));
      await screen.findByText(/una idea personalizada/i);
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /cerrar/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));
      await screen.findByText(/una idea personalizada/i);

      expect(fetchMock.mock.calls.filter(([url]) => url === "/api/recommendations/personalize")).toHaveLength(1);
    });

    it("al pasar a otra idea del carrusel pide esa (UX-05)", async () => {
      const fetchMock = stubPersonalize(async () => ({ ok: true, json: async () => ({ source: "catalog", templateKey: "economia.1" }) }));
      renderPersonalized();

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));
      await within(screen.getByRole("dialog")).findByText(/en qué se va tu dinero/i);
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Idea siguiente" }));

      await waitFor(() => expect(personalizeBodies(fetchMock).map((body) => body.templateKey)).toEqual(["economia.1", "economia.2"]));
    });

    it("si cambian las opciones de '¿Qué te ayuda?' de la categoría, la idea se vuelve a pedir (RF-40 v1.1)", async () => {
      const fetchMock = stubPersonalize(async () => ({ ok: true, json: async () => ({ source: "ai", templateKey: "economia.1", text: "Una idea personalizada con la longitud suficiente para pasar." }) }));
      const client = createTestClient();
      client.setQueryData(["categories"], [{ id: "c1", catalogId: "k-economia", status: "active", isSensitiveData: false, experienceTags: ["economia.presupuesto"] }]);
      renderPersonalized(client);

      fireEvent.click(screen.getByRole("button", { name: /una idea para ti/i }));
      await screen.findByText(/una idea personalizada/i);
      act(() => {
        client.setQueryData(["categories"], [{ id: "c1", catalogId: "k-economia", status: "active", isSensitiveData: false, experienceTags: ["economia.presupuesto", "economia.apps"] }]);
      });

      await waitFor(() => expect(personalizeBodies(fetchMock)).toHaveLength(2));
    });
  });
});
