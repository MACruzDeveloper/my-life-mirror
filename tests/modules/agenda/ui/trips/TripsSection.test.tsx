// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TripsSection } from "@modules/agenda/ui/trips/TripsSection";
import { withClient } from "../../../../helpers/queryClient";

// Como cuando el navegador no puede descargar el trozo del mapa (fallo real: caché de Vite desfasada; en producción, tras un despliegue).
vi.mock("@modules/agenda/ui/trips/TripsMap", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("TripsSection si el mapa no carga (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lo dice y el resto de la sección sigue funcionando: la página no se queda en blanco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => [{ id: "t1", countryCode: "PT", year: 2015 }] })));

    render(withClient(<TripsSection />));

    expect(await screen.findByText(/no se ha podido cargar el mapa/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /país/i })).toBeInTheDocument();
    expect(await screen.findByText("Portugal")).toBeInTheDocument();
  });
});
