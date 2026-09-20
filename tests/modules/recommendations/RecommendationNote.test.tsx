// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { RecommendationNote } from "@modules/recommendations/ui/RecommendationNote";
import { templateKeysFor, GENERAL_TEMPLATE_KEYS } from "@modules/recommendations/domain/recommendationCatalog";

describe("RecommendationNote (RF-18)", () => {
  it("traduce la plantilla y le pone un título amable", () => {
    render(<RecommendationNote templateKey="economia.1" categoryName="Economía" />);

    expect(screen.getByText(/una idea para ti/i)).toBeInTheDocument();
    expect(screen.getByText(/en qué se va tu dinero/i)).toBeInTheDocument();
  });

  it("las plantillas generales incluyen el nombre de la categoría", () => {
    render(<RecommendationNote templateKey="general.1" categoryName="Creatividad" />);

    expect(screen.getByText(/creatividad/i, { selector: "p" })).toBeInTheDocument();
  });

  it("todas las plantillas del catálogo tienen texto en español e inglés (no se muestra nunca una clave a pelo)", () => {
    const claves = [...new Set([...["Economía", "Vida social", "Pareja", "Sexo", "Deporte", "Aventura", "Espiritualidad", "Familia", "Inversiones"].flatMap(templateKeysFor), ...GENERAL_TEMPLATE_KEYS])];
    for (const lng of ["es", "en"]) {
      for (const clave of claves) {
        const texto = i18n.t(`recomendaciones.plantillas.${clave}`, { lng, categoria: "X" });
        expect(texto, `${lng}:${clave}`).not.toContain("recomendaciones.plantillas");
        expect(texto.length).toBeGreaterThan(20);
      }
    }
  });
});
