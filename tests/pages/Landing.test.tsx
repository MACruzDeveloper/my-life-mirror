// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
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

  it("explica cómo funciona antes de tener cuenta (UX-01)", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: /cómo funciona/i })).toBeInTheDocument();
  });

  describe("enlace de recuperación que llega a la portada (RF-38)", () => {
    afterEach(() => {
      window.location.hash = "";
    });

    function ResetPage() {
      const location = useLocation();
      return <div>Elegir nueva contraseña {location.hash}</div>;
    }

    function renderWithHash(hash: string) {
      window.location.hash = hash;
      return render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/restablecer-password" element={<ResetPage />} />
          </Routes>
        </MemoryRouter>,
      );
    }

    it("con el token de recuperación, lleva a elegir la contraseña nueva conservando el token", () => {
      renderWithHash("#access_token=abc123&type=recovery");

      expect(screen.getByText(/elegir nueva contraseña #access_token=abc123&type=recovery/i)).toBeInTheDocument();
    });

    it("con el error de un enlace caducado, lleva a la misma pantalla, que lo explica", () => {
      renderWithHash("#error=access_denied&error_code=otp_expired");

      expect(screen.getByText(/elegir nueva contraseña/i)).toBeInTheDocument();
    });

    it("sin nada de eso, la portada se queda como está", () => {
      renderWithHash("#como-funciona");

      expect(screen.getByRole("link", { name: /crear cuenta/i })).toBeInTheDocument();
    });
  });
});
