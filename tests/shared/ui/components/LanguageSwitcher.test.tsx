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

  it("en español ofrece 'English', nombrado en el idioma de destino para que lo reconozca quien no lee español", () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: "English" });
    expect(button).toHaveAttribute("lang", "en");
    expect(button).toHaveTextContent("EN");
  });

  it("al pulsarlo cambia el idioma, actualiza el atributo lang de la página y ofrece volver a 'Español'", async () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(i18n.language).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(await screen.findByRole("button", { name: "Español" })).toHaveAttribute("lang", "es");
  });
});
