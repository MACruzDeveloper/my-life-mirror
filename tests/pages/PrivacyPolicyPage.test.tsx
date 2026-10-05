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
    const text = screen.getByText(/desactivado por defecto/i).textContent ?? "";
    expect(text).toMatch(/anthropic/i);
    expect(text).toMatch(/nunca se envían tu nombre, tu email, tus experiencias privadas ni las categorías sensibles/i);
  });
});
