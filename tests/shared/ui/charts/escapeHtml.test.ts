import { describe, expect, it } from "vitest";
import { escapeHtml } from "@shared/ui/charts/escapeHtml";

describe("escapeHtml (tooltips de ECharts, que se pintan como HTML)", () => {
  it("neutraliza etiquetas y atributos", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe("&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
  });

  it("deja el texto normal (con acentos) igual", () => {
    expect(escapeHtml("Economía y Vida social")).toBe("Economía y Vida social");
  });
});
