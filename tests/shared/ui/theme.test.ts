import { describe, expect, it } from "vitest";
import { CHART_ACCENT, PALETTE, theme } from "@shared/ui/theme";

/** Contraste WCAG entre dos colores "#RRGGBB". */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("paleta de la app", () => {
  it("el texto se lee sobre los fondos claros (AA, 4,5:1), también el secundario", () => {
    for (const background of [PALETTE.mist, "#FFFFFF"]) {
      expect(contrast(theme.palette.text.primary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.palette.text.secondary, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("el botón principal se lee: azul noche con texto claro", () => {
    expect(contrast(theme.palette.primary.main, theme.palette.primary.contrastText)).toBeGreaterThanOrEqual(4.5);
  });

  it("la línea de los gráficos es un color vivo, distinto del de marca, que se distingue sobre la tarjeta blanca (3:1)", () => {
    expect(CHART_ACCENT).not.toBe(PALETTE.navy);
    expect(contrast(CHART_ACCENT, "#FFFFFF")).toBeGreaterThanOrEqual(3);
  });
});
