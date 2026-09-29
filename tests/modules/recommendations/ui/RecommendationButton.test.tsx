// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { GENERAL_TEMPLATE_KEYS, templateKeysFor } from "@modules/recommendations/domain/recommendationCatalog";

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
    const standard = ["Economía", "Vida social", "Pareja", "Sexo", "Deporte", "Aventura", "Espiritualidad", "Familia", "Inversiones"];
    const keys = [...new Set([...standard.flatMap(templateKeysFor), ...GENERAL_TEMPLATE_KEYS])];
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
});
