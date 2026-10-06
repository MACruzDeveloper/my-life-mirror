// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Button from "@mui/material/Button";
import { StyleProviders } from "@shared/ui/StyleProviders";

const allStyles = () => [...document.querySelectorAll("style")].map((style) => style.textContent ?? "").join("\n");

describe("StyleProviders (capas CSS)", () => {
  it("los estilos de MUI van en la capa `mui`: el CSS propio sin capa les gana sin !important", () => {
    render(
      <StyleProviders>
        <Button>Hola</Button>
      </StyleProviders>,
    );

    expect(screen.getByRole("button", { name: "Hola" })).toBeInTheDocument();
    const styles = allStyles();
    // Emotion lo emite compacto, sin espacios.
    expect(styles).toContain("@layer theme,base,mui,components,utilities;");
    expect(styles).toMatch(/@layer mui\{\.mui-[\w-]*MuiButton-root\{/);
  });
});
