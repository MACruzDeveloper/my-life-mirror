import { describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { createRouter } from "@shared/infrastructure/http/router";

function respuestaFalsa() {
  const res = { statusCode: 0, cuerpo: "", writeHead: vi.fn((s: number) => void (res.statusCode = s)), end: vi.fn((c: string) => void (res.cuerpo = c)) };
  return res as typeof res & ServerResponse;
}

function peticion(url: string) {
  return { url, method: "POST", headers: {}, body: {} } as never;
}

describe("createRouter (una función serverless por capacidad)", () => {
  it("despacha al handler cuyo nombre es el último segmento de la ruta", async () => {
    const login = vi.fn();
    const logout = vi.fn();
    const router = createRouter("/api/accounts/", { login, logout });
    const res = respuestaFalsa();

    await router(peticion("/api/accounts/logout"), res);

    expect(logout).toHaveBeenCalledOnce();
    expect(login).not.toHaveBeenCalled();
  });

  it("ignora la query string y una barra final", async () => {
    const session = vi.fn();
    const router = createRouter("/api/accounts/", { session });

    await router(peticion("/api/accounts/session?x=1"), respuestaFalsa());
    await router(peticion("/api/accounts/session/"), respuestaFalsa());

    expect(session).toHaveBeenCalledTimes(2);
  });

  it("responde 404 en JSON si no existe la acción, sin llamar a nadie", async () => {
    const login = vi.fn();
    const router = createRouter("/api/accounts/", { login });
    const res = respuestaFalsa();

    await router(peticion("/api/accounts/nope"), res);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.cuerpo)).toEqual({ error: "No encontrado" });
    expect(login).not.toHaveBeenCalled();
  });

  it("no confunde nombres heredados de Object (p. ej. constructor)", async () => {
    const router = createRouter("/api/accounts/", { login: vi.fn() });
    const res = respuestaFalsa();

    await router(peticion("/api/accounts/constructor"), res);

    expect(res.statusCode).toBe(404);
  });

  it("rechaza rutas anidadas (accounts/login/extra)", async () => {
    const login = vi.fn();
    const router = createRouter("/api/accounts/", { login });
    const res = respuestaFalsa();

    await router(peticion("/api/accounts/login/extra"), res);

    expect(res.statusCode).toBe(404);
    expect(login).not.toHaveBeenCalled();
  });
});
