// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renderiza los elementos intermedios como enlaces y el último como texto plano", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: "Inicio", path: "/" },
            { label: "Iniciar sesión", path: "/login" },
            { label: "Recuperar contraseña" },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "Recuperar contraseña" })).not.toBeInTheDocument();
    expect(screen.getByText("Recuperar contraseña")).toBeInTheDocument();
  });
});
