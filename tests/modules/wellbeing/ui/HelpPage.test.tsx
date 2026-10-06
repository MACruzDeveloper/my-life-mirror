// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import i18n from "@shared/ui/i18n";
import { HelpPage } from "@modules/wellbeing/ui/HelpPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <HelpPage />
    </MemoryRouter>,
  );
}

describe("HelpPage (RF-30)", () => {
  afterEach(async () => {
    await i18n.changeLanguage("es");
  });

  it("enseña el 024 y el 112 con un botón para llamar, el directorio internacional y el aviso", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "¿Necesitas ayuda ahora?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /llamar al 024/i })).toHaveAttribute("href", "tel:024");
    expect(screen.getByRole("link", { name: /llamar al 112/i })).toHaveAttribute("href", "tel:112");
    expect(screen.getByText(/atención a la conducta suicida/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /find a helpline/i })).toHaveAttribute("href", "https://findahelpline.com");
    expect(screen.getByText(/no es un servicio profesional ni de emergencias/i)).toBeInTheDocument();
    expect(screen.getByText(/no aparece por nada que hayas puntuado o escrito/i)).toBeInTheDocument();
  });

  it("en inglés, con los mismos números", async () => {
    await i18n.changeLanguage("en");
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Need help now?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /call 024/i })).toHaveAttribute("href", "tel:024");
  });
});
