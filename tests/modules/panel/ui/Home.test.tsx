// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Home } from "@modules/panel/ui/Home";

// Header/sesión/cerrar-sesión ya no son responsabilidad de Home — los cubre
// ProtectedLayout (src/shared/ui/ProtectedLayout.tsx), que es quien los
// monta de verdad en la ruta real (App.tsx). Home solo pinta su contenido.
describe("Home (RF-39, placeholder de RF-14)", () => {
  it("muestra el mensaje de bienvenida", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
