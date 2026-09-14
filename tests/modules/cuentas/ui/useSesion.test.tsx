// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSesion } from "@modules/cuentas/ui/useSesion";

describe("useSesion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("empieza cargando y luego refleja una sesión autenticada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) }),
    );

    const { result } = renderHook(() => useSesion());

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.autenticado).toBe(true);
    expect(result.current.email).toBe("ana@ejemplo.com");
  });

  it("refleja que no hay sesión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: false }) }));

    const { result } = renderHook(() => useSesion());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.autenticado).toBe(false);
  });

  it("trata un fallo de red como no autenticado, sin quedarse cargando para siempre", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = renderHook(() => useSesion());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.autenticado).toBe(false);
  });
});
