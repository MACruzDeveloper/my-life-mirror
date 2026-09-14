// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { Landing } from "@pages/Landing";

describe("Landing (RF-39)", () => {
  it("muestra enlaces a registro e inicio de sesión", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
  });
});
