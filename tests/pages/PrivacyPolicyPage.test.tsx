// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { PrivacyPolicyPage } from "@pages/PrivacyPolicyPage";

describe("PrivacyPolicyPage (RNF-05)", () => {
  it("muestra el título y la versión vigente", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /política de privacidad/i })).toBeInTheDocument();
    expect(screen.getByText(/versión 2026-09/i)).toBeInTheDocument();
  });

  it("explica las ideas con IA: opcionales, qué se envía a quién y qué nunca (RF-40)", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /ideas personalizadas con ia/i })).toBeInTheDocument();
    const text = screen.getByText(/al abrir una idea para un área no sensible/i).textContent ?? "";
    expect(text).toMatch(/anthropic/i);
    expect(text).toMatch(/nunca se envían tu nombre, tu email, tus experiencias privadas ni las categorías sensibles/i);
  });

  it("explica las sugerencias a partir de las experiencias: aparte, por experiencia, qué se quita y qué nunca (RF-45)", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /sugerencias de la ia a partir de tus experiencias/i })).toBeInTheDocument();
    const text = screen.getByText(/solo la experiencia que tú le pidas analizar/i).textContent ?? "";
    expect(text).toMatch(/desactivado por defecto/i);
    expect(text).toMatch(/quitamos emails, teléfonos, enlaces y números largos/i);
    expect(text).toMatch(/nunca se envían las categorías sensibles/i);
    expect(text).toMatch(/la ia no escribe nada sobre ti/i);
  });
});
