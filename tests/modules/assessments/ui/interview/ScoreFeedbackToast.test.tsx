// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { ScoreFeedbackToast } from "@modules/assessments/ui/interview/ScoreFeedbackToast";

describe("ScoreFeedbackToast (UX-09)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("con 8 reconoce e invita, nombrando la categoría y sin felicitar", () => {
    render(<ScoreFeedbackToast feedback={{ categoryName: "Idiomas", score: 8, tone: "recognize", inviteToShare: true }} onClose={() => {}} />);

    const message = screen.getByRole("status");
    expect(message).toHaveTextContent(/idiomas te va bien ahora/i);
    expect(message).toHaveTextContent(/qué te está ayudando/i);
    expect(message).toHaveTextContent(/compartirlo de forma anónima/i);
    expect(message).not.toHaveTextContent(/enhorabuena/i);
  });

  it("con 9 o 10 en una categoría no sensible, felicita con sobriedad", () => {
    render(<ScoreFeedbackToast feedback={{ categoryName: "Aventura", score: 10, tone: "congratulate", inviteToShare: true }} onClose={() => {}} />);

    expect(screen.getByRole("status")).toHaveTextContent(/enhorabuena.*un 10 en aventura/i);
  });

  it("en una categoría sensible no invita a compartir", () => {
    render(<ScoreFeedbackToast feedback={{ categoryName: "Salud", score: 9, tone: "recognize", inviteToShare: false }} onClose={() => {}} />);

    expect(screen.getByRole("status")).toHaveTextContent(/anotarlo en tu diario/i);
    expect(screen.getByRole("status")).not.toHaveTextContent(/compart/i);
  });

  it("se cierra sola a los 5 segundos, y antes con su botón", () => {
    const onClose = vi.fn();
    render(<ScoreFeedbackToast feedback={{ categoryName: "Idiomas", score: 8, tone: "recognize", inviteToShare: true }} onClose={onClose} />);

    act(() => void vi.advanceTimersByTime(4900));
    expect(onClose).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("sin mensaje no pinta nada", () => {
    render(<ScoreFeedbackToast feedback={undefined} onClose={() => {}} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("RF-50: al quedar todo en verde, lo dice y enlaza a Inicio, donde están las ideas para disfrutar", () => {
    render(
      <MemoryRouter>
        <ScoreFeedbackToast feedback={{ kind: "balanced" }} onClose={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/todo en verde/i);
    expect(screen.getByRole("link", { name: /ver ideas en inicio/i })).toHaveAttribute("href", "/inicio");
  });

  it("UX-12: un resumen con una línea por aviso, y enlace a Inicio si hay ideas nuevas", () => {
    render(
      <MemoryRouter>
        <ScoreFeedbackToast feedback={{ kind: "summary", items: ["Finanzas: tienes una idea nueva.", "¡Enhorabuena! Un 9 en Aventura."], linkToHome: true }} onClose={() => {}} />
      </MemoryRouter>,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Finanzas: tienes una idea nueva.", "¡Enhorabuena! Un 9 en Aventura."]);
    expect(screen.getByRole("link", { name: /ver en inicio/i })).toHaveAttribute("href", "/inicio");
  });

  it("UX-12: un resumen largo se queda más tiempo (dos segundos más por aviso)", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <ScoreFeedbackToast feedback={{ kind: "summary", items: ["Uno.", "Dos.", "Tres."], linkToHome: false }} onClose={onClose} />
      </MemoryRouter>,
    );

    act(() => void vi.advanceTimersByTime(8900));
    expect(onClose).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(onClose).toHaveBeenCalled();
  });
});
