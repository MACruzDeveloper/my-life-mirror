import { describe, expect, it } from "vitest";
import { createQueryClient } from "@shared/ui/api/queryClient";

describe("createQueryClient", () => {
  it("guarda los datos para siempre: solo se vuelve a pedir si una acción los invalida (o al recargar)", () => {
    const opciones = createQueryClient().getDefaultOptions().queries;

    expect(opciones?.staleTime).toBe(Infinity);
    expect(opciones?.gcTime).toBe(Infinity);
    expect(opciones?.refetchOnWindowFocus).toBe(false);
    expect(opciones?.retry).toBe(false);
  });
});
