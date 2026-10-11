import { describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { z } from "zod";
import { publicHandler } from "@shared/infrastructure/http/publicHandler";
import { reply } from "@shared/infrastructure/http/sessionHandler";
import { InMemoryAttemptLimiter } from "@shared/infrastructure/InMemoryAttemptLimiter";
import type { AppContext } from "@shared/infrastructure/container";
import type { AttemptLimiter } from "@shared/domain/AttemptLimiter";
import { err, ok } from "@shared/domain/Result";
import { ValidationError } from "@shared/domain/DomainError";
import { WeakPasswordError } from "@modules/accounts/domain/Password";

function fakeResponse() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    writeHead: vi.fn((status: number, headers: Record<string, string>) => {
      res.statusCode = status;
      res.headers = headers;
    }),
    end: vi.fn((chunk: string) => void (res.body = JSON.parse(chunk))),
  };
  return res as typeof res & ServerResponse;
}

function request({ method = "POST", body, headers = {} }: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  return { method, url: "/api/x", headers: { host: "app.example", "x-real-ip": "203.0.113.7", ...headers }, body } as never;
}

function contextWith(attemptLimiter: AttemptLimiter = new InMemoryAttemptLimiter({ now: () => new Date("2026-10-11T10:00:00Z") })) {
  return { attemptLimiter } as unknown as AppContext;
}

async function call(handler: ReturnType<typeof publicHandler>, req: never) {
  const res = fakeResponse();
  await handler(req, res);
  return res;
}

const Schema = z.object({ email: z.string().max(20) });
const LIMIT = { perIp: { max: 3, windowSeconds: 60 }, perIdentity: { max: 2, windowSeconds: 60 } };

describe("publicHandler: la plantilla de los controladores sin sesión (login, registro…)", () => {
  it("solo POST → 405; cuerpo que no encaja (o demasiado largo) → 400, sin ejecutar nada", async () => {
    const execute = vi.fn(async () => ok({}));
    const handler = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, execute });

    expect((await call(handler, request({ method: "GET" }))).statusCode).toBe(405);
    expect((await call(handler, request({ body: { email: 3 } }))).statusCode).toBe(400);
    expect((await call(handler, request({ body: { email: "a".repeat(21) } }))).statusCode).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("un cuerpo desmesurado se rechaza (413) sin gastar un intento ni ejecutar nada", async () => {
    const execute = vi.fn(async () => ok({}));
    const handler = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: z.object({ email: z.string() }), execute });

    const res = await call(handler, request({ body: { email: "a".repeat(40_000) } }));

    expect(res.statusCode).toBe(413);
    expect(execute).not.toHaveBeenCalled();
  });

  it("ejecuta con el cuerpo validado y responde sin caché", async () => {
    const handler = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, status: 201, execute: async ({ body }) => ok({ email: body.email }) });

    const res = await call(handler, request({ body: { email: "ana@ejemplo.com" } }));

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ email: "ana@ejemplo.com" });
    expect(res.headers).toMatchObject({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  });

  it("una respuesta a medida (con su cookie) pasa tal cual", async () => {
    const handler = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, execute: async () => reply(200, { id: "u1" }, { "Set-Cookie": "sesion=abc" }) });

    const res = await call(handler, request({ body: { email: "a@b.cc" } }));

    expect(res.headers).toMatchObject({ "Set-Cookie": "sesion=abc", "Cache-Control": "no-store" });
  });

  it("traduce el error de dominio; una contraseña débil lleva los requisitos que fallan (SEC-01)", async () => {
    const invalid = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, execute: async () => err(new ValidationError("Mal")) });
    const weak = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, execute: async () => err(new WeakPasswordError(["length", "common"])) });

    expect((await call(invalid, request({ body: { email: "a@b.cc" } }))).body).toEqual({ error: "Mal", code: "VALIDATION_ERROR" });
    const res = await call(weak, request({ body: { email: "a@b.cc" } }));
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ code: "WEAK_PASSWORD", rules: ["length", "common"] });
  });

  it("si algo lanza, 500 genérico (sin filtrar el error)", async () => {
    const handler = publicHandler({
      route: "/api/x",
      getContext: () => contextWith(),
      schema: Schema,
      execute: async () => {
        throw new Error("Supabase caído: detalle interno");
      },
    });

    const res = await call(handler, request({ body: { email: "a@b.cc" } }));

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Error interno del servidor" });
  });

  describe("límite de intentos (SEC-02)", () => {
    function limited(context = contextWith()) {
      const execute = vi.fn(async () => ok({}));
      const handler = publicHandler({ route: "/api/x", getContext: () => context, schema: Schema, limit: { ...LIMIT, name: "login", identity: (body) => body.email }, execute });
      return { handler, execute };
    }

    it("corta por email al superar su máximo, venga de la IP que venga, con 429 y cuánto esperar", async () => {
      const { handler, execute } = limited();
      const attempt = (ip: string) => call(handler, request({ body: { email: "Ana@Ejemplo.com " }, headers: { "x-real-ip": ip } }));

      expect((await attempt("203.0.113.1")).statusCode).toBe(200);
      expect((await attempt("203.0.113.2")).statusCode).toBe(200);
      const res = await attempt("203.0.113.3");

      expect(res.statusCode).toBe(429);
      expect(res.body).toMatchObject({ code: "RATE_LIMITED" });
      expect(res.headers).toMatchObject({ "Retry-After": "60" });
      expect(execute).toHaveBeenCalledTimes(2);
    });

    it("mayúsculas y espacios no dan intentos extra para el mismo email", async () => {
      const { handler } = limited();
      await call(handler, request({ body: { email: "ana@ejemplo.com" }, headers: { "x-real-ip": "203.0.113.1" } }));
      await call(handler, request({ body: { email: "ANA@ejemplo.com" }, headers: { "x-real-ip": "203.0.113.2" } }));

      const res = await call(handler, request({ body: { email: " ana@EJEMPLO.com" }, headers: { "x-real-ip": "203.0.113.3" } }));

      expect(res.statusCode).toBe(429);
    });

    it("corta por IP al superar su máximo, aunque cambie de email", async () => {
      const { handler } = limited();
      const attempt = (email: string) => call(handler, request({ body: { email } }));

      for (const email of ["a@b.cc", "b@b.cc", "c@b.cc"]) expect((await attempt(email)).statusCode).toBe(200);

      expect((await attempt("d@b.cc")).statusCode).toBe(429);
    });

    it("no guarda el email ni la IP en claro: las claves van resumidas", async () => {
      const keys: string[] = [];
      const spy: AttemptLimiter = { tryConsume: async (key) => (keys.push(key), true) };
      const { handler } = limited(contextWith(spy));

      await call(handler, request({ body: { email: "ana@ejemplo.com" } }));

      expect(keys).toHaveLength(2);
      for (const key of keys) {
        expect(key).toMatch(/^login:(ip|id):[0-9a-f]{64}$/);
        expect(key).not.toContain("ana");
        expect(key).not.toContain("203.0.113.7");
      }
    });

    it("si el contador falla, no se bloquea a nadie (y queda en el log)", async () => {
      const broken: AttemptLimiter = {
        tryConsume: async () => {
          throw new Error("base de datos caída");
        },
      };
      const { handler, execute } = limited(contextWith(broken));

      const res = await call(handler, request({ body: { email: "ana@ejemplo.com" } }));

      expect(res.statusCode).toBe(200);
      expect(execute).toHaveBeenCalledOnce();
    });
  });

  describe("origen de la petición (defensa adicional contra CSRF)", () => {
    const handler = publicHandler({ route: "/api/x", getContext: () => contextWith(), schema: Schema, execute: async () => ok({}) });
    const body = { email: "a@b.cc" };

    it("rechaza una petición que viene de otra web", async () => {
      const res = await call(handler, request({ body, headers: { origin: "https://otra-web.example" } }));

      expect(res.statusCode).toBe(403);
    });

    it("acepta la de la propia web y la que no trae origen (una herramienta, no un navegador)", async () => {
      expect((await call(handler, request({ body, headers: { origin: "https://app.example" } }))).statusCode).toBe(200);
      expect((await call(handler, request({ body }))).statusCode).toBe(200);
    });
  });
});
