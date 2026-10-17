// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("UX-08: el título, la descripción, el audio y los botones van sobre la imagen, que dice estar generada con IA y no se anuncia", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const hero = screen.getByRole("region", { name: "MyLifeMirror" });
    expect(within(hero).getByRole("heading", { level: 1, name: "MyLifeMirror" })).toBeInTheDocument();
    // Quien ya tiene cuenta entra desde aquí mismo: los botones, en la primera vista, después del audio.
    expect(within(hero).getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/registro");
    expect(within(hero).getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
    // El aviso de imagen generada con IA, una sola vez (fijo sobre las dos imágenes), no repetido en cada una.
    expect(screen.getAllByText(/imagen generada con ia/i)).toHaveLength(1);
    // La flecha es un enlace a la parte siguiente: funciona también sin JavaScript y con el teclado.
    expect(within(hero).getByRole("link", { name: "Ver cómo funciona" })).toHaveAttribute("href", "#como-funciona");
    // Decorativa: es un fondo, no una imagen con texto alternativo.
    expect(within(hero).queryByRole("img")).not.toBeInTheDocument();
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

describe("Landing: presentación en audio", () => {
  afterEach(() => vi.restoreAllMocks());

  it("no suena sola; al pulsar, suena y se puede pausar; dice que la voz está generada con IA y tiene transcripción", async () => {
    // jsdom no reproduce audio: se comprueba que se le pide.
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async () => {});
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const hero = screen.getByRole("region", { name: "MyLifeMirror" });
    expect(play).not.toHaveBeenCalled();
    // Antes de pulsar, solo el botón: el aviso de IA y la transcripción aparecen con el resto del reproductor.
    expect(within(hero).queryByText(/voz generada con ia/i)).not.toBeInTheDocument();

    fireEvent.click(within(hero).getByRole("button", { name: /escuchar la presentación/i }));
    expect(play).toHaveBeenCalledOnce();
    // Al sonar: la barra para ir adelante o atrás, y el tiempo.
    const audio = hero.querySelector("audio")!;
    Object.defineProperty(audio, "duration", { value: 47, configurable: true });
    fireEvent.loadedMetadata(audio);
    audio.currentTime = 12;
    fireEvent.timeUpdate(audio);
    const slider = await within(hero).findByRole("slider", { name: /posición/i });
    expect(within(hero).getByText(/voz generada con ia/i)).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuenow", "12");
    expect(within(hero).getByText("0:12 / 0:47")).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: 30 } });
    expect(audio.currentTime).toBe(30);
    fireEvent.click(within(hero).getByRole("button", { name: /pausar/i }));
    expect(pause).toHaveBeenCalled();

    // Volver al estado inicial: se para, vuelve al principio y desaparecen la barra y el aviso.
    fireEvent.click(within(hero).getByRole("button", { name: /cerrar el reproductor/i }));
    expect(within(hero).queryByRole("slider")).not.toBeInTheDocument();
    expect(within(hero).getByRole("button", { name: /escuchar la presentación/i })).toBeInTheDocument();
    expect(audio.currentTime).toBe(0);
    // Y se puede volver a empezar.
    fireEvent.click(within(hero).getByRole("button", { name: /escuchar la presentación/i }));
    expect(await within(hero).findByRole("slider", { name: /posición/i })).toBeInTheDocument();

    fireEvent.click(within(hero).getByRole("button", { name: /transcripción/i }));
    expect(await screen.findByRole("dialog", { name: /transcripción/i })).toHaveTextContent(/un espejo de tu vida, no un examen/i);
  });
});
