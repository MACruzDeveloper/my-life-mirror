// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { CategoriesPage } from "@modules/categories/ui/CategoriesPage";
import { withClient } from "../../../helpers/queryClient";

const LABELS = [
  { catalogId: "k-eco", key: "economia", translations: { es: { name: "Economía", description: "Dinero y estabilidad." } } },
  { catalogId: "k-ave", key: "aventura", translations: { es: { name: "Aventura", description: "Nuevas experiencias y retos." } } },
  { catalogId: "k-new", translations: { es: { name: "Creatividad", description: "Creada desde administración." } } },
];

describe("CategoriesPage (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("una tarjeta por categoría del catálogo; solo las que tienen página son enlaces, el resto, 'Próximamente'", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => LABELS })));

    render(withClient(<MemoryRouter><CategoriesPage /></MemoryRouter>));

    expect(await screen.findByRole("link", { name: /aventura/i })).toHaveAttribute("href", "/categorias/aventura");
    expect(screen.getByText("Nuevas experiencias y retos.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /economía/i })).not.toBeInTheDocument();
    expect(screen.getByText("Economía").closest("[aria-disabled='true']")).toHaveTextContent(/próximamente/i);
    expect(screen.getByText("Creatividad").closest("[aria-disabled='true']")).toBeInTheDocument();
  });
});
