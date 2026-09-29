// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SessionProvider, useSession } from "@shared/ui/context/SessionContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe("SessionContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("empieza cargando y luego refleja una sesión autenticada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com", name: "Ana" }) }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(true);
    expect(result.current.email).toBe("ana@ejemplo.com");
    expect(result.current.name).toBe("Ana");
  });

  it("expone el rol de la sesión, con 'usuario' si no llega", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "a@b.c", rol: "admin" }) }));
    const admin = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(admin.result.current.loading).toBe(false));
    expect(admin.result.current.rol).toBe("admin");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: true, email: "a@b.c" }) }));
    const normal = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(normal.result.current.loading).toBe(false));
    expect(normal.result.current.rol).toBe("usuario");
  });

  it("refleja que no hay sesión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ autenticado: false }) }));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
  });

  it("trata un fallo de red como no autenticado, sin quedarse cargando para siempre", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authenticated).toBe(false);
  });

  it("refresh() vuelve a consultar /api/sesion y refleja los datos nuevos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com" }) })
      .mockResolvedValueOnce({ json: async () => ({ autenticado: true, email: "ana@ejemplo.com", name: "Ana" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.name).toBeUndefined();

    result.current.refresh();

    await waitFor(() => expect(result.current.name).toBe("Ana"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("useSession() fuera de SessionProvider lanza un error claro", () => {
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/);
  });
});
