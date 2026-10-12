// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { LanguageSwitcher } from "@shared/ui/components/LanguageSwitcher";

describe("LanguageSwitcher (RNF-10)", () => {
  afterEach(async () => {
    await i18n.changeLanguage("es");
  });

  it("es un interruptor 'English' (en inglés, para quien no lee español), desactivado en español, entre las dos banderas", () => {
    const { container } = render(<LanguageSwitcher />);

    const toggle = screen.getByRole("switch", { name: "English" });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute("lang", "en");
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("activarlo pasa a inglés (y el atributo lang de la página); desactivarlo vuelve a español", async () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("switch", { name: "English" }));
    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(await screen.findByRole("switch", { name: "English" })).toBeChecked();

    fireEvent.click(screen.getByRole("switch", { name: "English" }));
    expect(i18n.language).toBe("es");
  });

  it("pulsar una bandera elige su idioma", () => {
    const { container } = render(<LanguageSwitcher />);
    const [spanishFlag, englishFlag] = container.querySelectorAll("img");

    fireEvent.click(englishFlag);
    expect(i18n.language).toBe("en");
    fireEvent.click(spanishFlag);
    expect(i18n.language).toBe("es");
  });

  describe("variante de texto, para la portada (UX-08)", () => {
    it("dos botones ES y EN con su nombre completo para lectores de pantalla, una etiqueta pequeña y sin banderas", () => {
      const { container } = render(<LanguageSwitcher variant="text" />);

      expect(screen.getByText("Selecciona idioma")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("lang", "en");
      expect(container.querySelectorAll("img")).toHaveLength(0);
    });

    it("pulsar EN pasa a inglés y la etiqueta también; ES vuelve", async () => {
      render(<LanguageSwitcher variant="text" />);

      fireEvent.click(screen.getByRole("button", { name: "English" }));
      expect(i18n.language).toBe("en");
      expect(await screen.findByText("Select language")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByRole("button", { name: "Español" }));
      expect(i18n.language).toBe("es");
    });
  });
});
