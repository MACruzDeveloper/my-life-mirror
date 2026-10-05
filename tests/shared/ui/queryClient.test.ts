import { describe, expect, it } from "vitest";
import { createQueryClient } from "@shared/ui/api/queryClient";

describe("createQueryClient", () => {
  it("guarda los datos para siempre: solo se vuelve a pedir si una acción los invalida (o al recargar)", () => {
    const options = createQueryClient().getDefaultOptions().queries;

    expect(options?.staleTime).toBe(Infinity);
    expect(options?.gcTime).toBe(Infinity);
    expect(options?.refetchOnWindowFocus).toBe(false);
    expect(options?.retry).toBe(false);
  });
});
