// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AvatarPicker } from "@modules/accounts/ui/AvatarPicker";

const KEYS = ["roundGlasses", "longBraids"];

describe("AvatarPicker (RF-26)", () => {
  it("enseña los avatares publicados, cada uno con su descripción como texto alternativo, y la opción de no llevar ninguno", () => {
    render(<AvatarPicker keys={KEYS} onChange={() => {}} />);

    const group = screen.getByRole("radiogroup", { name: /tu avatar/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /gafas redondas/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dos trenzas largas/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /sin avatar/i })).toBeChecked();
    expect(screen.getByRole("img", { name: /gafas redondas/i })).toHaveAttribute("src", "/avatars/roundGlasses.webp");
    expect(screen.getByText(/generadas con ia y revisadas/i)).toBeInTheDocument();
  });

  it("marca el elegido y avisa del cambio; 'Sin avatar' lo quita", () => {
    const onChange = vi.fn();
    render(<AvatarPicker keys={KEYS} value="longBraids" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /dos trenzas largas/i })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /gafas redondas/i }));
    fireEvent.click(screen.getByRole("radio", { name: /sin avatar/i }));

    expect(onChange.mock.calls).toEqual([["roundGlasses"], [undefined]]);
  });

  it("sin ningún avatar publicado todavía, no enseña nada", () => {
    const { container } = render(<AvatarPicker keys={[]} onChange={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
