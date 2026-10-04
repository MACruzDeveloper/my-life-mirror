import { afterEach, describe, expect, it, vi } from "vitest";
import { getJson, HttpError } from "@shared/ui/api/getJson";

afterEach(() => vi.unstubAllGlobals());

describe("getJson", () => {
  it("devuelve el JSON de una respuesta correcta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) }));

    expect(await getJson("/api/x")).toEqual({ a: 1 });
  });

  it("lanza HttpError con el estado si la respuesta no es 2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(getJson("/api/x")).rejects.toMatchObject({ status: 403 });
    await expect(getJson("/api/x")).rejects.toBeInstanceOf(HttpError);
  });

  it("pasa la señal de cancelación a fetch: al cancelar una carga, la petición se aborta", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await getJson("/api/x", controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/x", { signal: controller.signal });
  });
});
