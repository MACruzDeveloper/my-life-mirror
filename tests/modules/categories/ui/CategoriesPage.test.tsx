// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { CategoriesPage } from "@modules/categories/ui/CategoriesPage";
import { withClient } from "../../../helpers/queryClient";

const LABELS = [
  { catalogId: "k-eco", key: "economia", translations: { es: { name: "Finanzas", description: "Dinero y estabilidad." } } },
  { catalogId: "k-ave", key: "aventura", translations: { es: { name: "Aventura", description: "Nuevas experiencias y retos." } } },
  { catalogId: "k-dep", key: "deporte", translations: { es: { name: "Deporte", description: "Actividad física." } } },
  { catalogId: "k-esp", key: "espiritualidad", translations: { es: { name: "Espiritualidad", description: "Creencias." } } },
  { catalogId: "k-new", translations: { es: { name: "Creatividad", description: "Creada desde administración." } } },
  { catalogId: "k-inv", key: "inversiones", retired: true, translations: { es: { name: "Inversiones", description: "Retirada." } } },
];

describe("CategoriesPage (RF-49)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("una tarjeta por categoría del catálogo; solo las que tienen página son enlaces, el resto, 'Próximamente'", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => LABELS })));

    render(withClient(<MemoryRouter><CategoriesPage /></MemoryRouter>));

    expect(await screen.findByRole("link", { name: /aventura/i })).toHaveAttribute("href", "/categorias/aventura");
    expect(screen.getByText("Nuevas experiencias y retos.")).toBeInTheDocument();
    // RF-49 (hitos): Deporte ya tiene página.
    expect(screen.getByRole("link", { name: /deporte/i })).toHaveAttribute("href", "/categorias/deporte");
    expect(screen.getByRole("link", { name: /espiritualidad/i })).toHaveAttribute("href", "/categorias/espiritualidad");
    expect(screen.queryByRole("link", { name: /finanzas/i })).not.toBeInTheDocument();
    expect(screen.getByText("Finanzas").closest("[aria-disabled='true']")).toHaveTextContent(/próximamente/i);
    expect(screen.getByText("Creatividad").closest("[aria-disabled='true']")).toBeInTheDocument();
    // Una retirada no se ofrece.
    expect(screen.queryByText("Inversiones")).not.toBeInTheDocument();
  });

  it("cada tarjeta lleva el icono de su categoría; una creada desde administración, uno genérico", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: async () => LABELS })));

    render(withClient(<MemoryRouter><CategoriesPage /></MemoryRouter>));

    const card = (name: string) => screen.getByText(name).closest("li")!;
    await screen.findByText("Aventura");
    expect(card("Aventura").querySelector("[data-testid='ExploreOutlinedIcon']")).toBeInTheDocument();
    expect(card("Deporte").querySelector("[data-testid='DirectionsRunOutlinedIcon']")).toBeInTheDocument();
    expect(card("Finanzas").querySelector("[data-testid='AccountBalanceWalletOutlinedIcon']")).toBeInTheDocument();
    expect(card("Creatividad").querySelector("[data-testid='CategoryOutlinedIcon']")).toBeInTheDocument();
  });
});
