import { describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { z } from "zod";
import { action, reply, sessionHandler } from "@shared/infrastructure/http/sessionHandler";
import type { AppContext } from "@shared/infrastructure/container";
import { err, ok } from "@shared/domain/Result";
import { ConsentRequiredError, NotFoundError, ValidationError } from "@shared/domain/DomainError";
import { NotShareableError } from "@modules/assessments/domain/Experience";

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

function request(method: string, { body, url = "/api/x", cookie = "sesion=ok", origin }: { body?: unknown; url?: string; cookie?: string; origin?: string } = {}) {
  return { method, url, headers: { cookie, host: "app.example", ...(origin && { origin }) }, body } as never;
}

/** Solo lo que usa la plantilla: la sesión es válida con la cookie "ok". */
const context = {
  verifySession: async (token: string | undefined) => (token === "ok" ? ok({ id: "u1", email: "ana@ejemplo.com", rol: "usuario" }) : err(new ValidationError("no"))),
} as unknown as AppContext;

async function call(handler: ReturnType<typeof sessionHandler>, req: never) {
  const res = fakeResponse();
  await handler(req, res);
  return res;
}

describe("sessionHandler: la plantilla común de los controladores con sesión", () => {
  const Schema = z.object({ name: z.string() });

  it("un método no previsto → 405; sin sesión → 401, sin ejecutar nada", async () => {
    const execute = vi.fn(async () => ok({}));
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ schema: Schema, execute }) });

    expect((await call(handler, request("GET"))).statusCode).toBe(405);
    expect((await call(handler, request("POST", { body: { name: "a" }, cookie: "sesion=mala" }))).statusCode).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("valida el cuerpo con su esquema → 400 si no encaja", async () => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ schema: Schema, execute: async () => ok({}) }) });

    const res = await call(handler, request("POST", { body: { name: 3 } }));

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Petición mal formada" });
  });

  it("ejecuta con el usuario de la sesión (nunca del cuerpo), el cuerpo validado y la query", async () => {
    const execute = vi.fn(async ({ user, body, query }: { user: { id: string }; body: { name: string }; query: URLSearchParams }) => ok({ userId: user.id, name: body.name, q: query.get("q") }));
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ schema: Schema, status: 201, execute }) });

    const res = await call(handler, request("POST", { body: { name: "Ana", userId: "otro" }, url: "/api/x?q=1" }));

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ userId: "u1", name: "Ana", q: "1" });
  });

  it("un null a propósito se devuelve como null (p. ej. 'aún no hay perfil'); sin valor, { ok: true }", async () => {
    const handler = sessionHandler({
      route: "/api/x",
      getContext: () => context,
      GET: action({ execute: async () => ok(null) }),
      POST: action({ execute: async () => ok(undefined) }),
    });

    expect((await call(handler, request("GET"))).body).toBeNull();
    expect((await call(handler, request("POST"))).body).toEqual({ ok: true });
  });

  it("varios métodos en un mismo controlador; GET no lee cuerpo", async () => {
    const handler = sessionHandler({
      route: "/api/x",
      getContext: () => context,
      GET: action({ execute: async ({ body }) => ok({ body: body ?? null }) }),
      DELETE: action({ execute: async () => ok({ deleted: true }) }),
    });

    expect((await call(handler, request("GET", { body: { ignored: true } }))).body).toEqual({ body: null });
    expect((await call(handler, request("DELETE"))).body).toEqual({ deleted: true });
    expect((await call(handler, request("PATCH"))).statusCode).toBe(405);
  });

  it.each([
    [new NotFoundError("No existe"), 404],
    [new ConsentRequiredError("Falta consentimiento"), 409],
    [new ValidationError("Mal"), 400],
  ])("traduce el error de dominio a su estado, con su código: %s", async (error, status) => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ execute: async () => err(error) }) });

    const res = await call(handler, request("POST"));

    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({ error: error.message, code: error.code });
  });

  it("RF-43: un 'no se puede compartir' es un 422 con su motivo", async () => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, PATCH: action({ execute: async () => err(new NotShareableError("health")) }) });

    const res = await call(handler, request("PATCH"));

    expect(res.statusCode).toBe(422);
    expect(res.body).toMatchObject({ code: "NOT_SHAREABLE", reason: "health" });
  });

  it("una respuesta a medida (estado, cuerpo y cabeceras) pasa tal cual", async () => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ execute: async () => reply(409, { error: "No disponible" }, { "Set-Cookie": "a=b" }) }) });

    const res = await call(handler, request("POST"));

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "No disponible" });
    expect(res.headers).toMatchObject({ "Content-Type": "application/json", "Set-Cookie": "a=b" });
  });

  it("una respuesta a medida puede ir indentada (un archivo para descargar, RF-05)", async () => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, GET: action({ execute: async () => reply(200, { a: 1 }, {}, { pretty: true }) }) });
    const res = fakeResponse();
    res.end = vi.fn((chunk: string) => void (res.body = chunk)) as never;

    await handler(request("GET"), res);

    expect(res.body).toBe('{\n  "a": 1\n}');
  });

  it("si algo lanza, 500 genérico (sin filtrar el error)", async () => {
    const handler = sessionHandler({
      route: "/api/x",
      getContext: () => context,
      POST: action({
        execute: async () => {
          throw new Error("Supabase caído: detalle interno");
        },
      }),
    });

    const res = await call(handler, request("POST"));

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Error interno del servidor" });
  });

  it("SEC-03: una acción que cambia datos pedida desde otra web → 403, sin ejecutar nada; leer (GET) no se comprueba", async () => {
    const execute = vi.fn(async () => ok({}));
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, GET: action({ execute }), POST: action({ execute }), DELETE: action({ execute }) });

    expect((await call(handler, request("POST", { origin: "https://otra-web.example" }))).statusCode).toBe(403);
    expect((await call(handler, request("DELETE", { origin: "https://otra-web.example" }))).statusCode).toBe(403);
    expect(execute).not.toHaveBeenCalled();

    expect((await call(handler, request("POST", { origin: "https://app.example" }))).statusCode).toBe(200);
    expect((await call(handler, request("GET", { origin: "https://otra-web.example" }))).statusCode).toBe(200);
  });

  it("SEC-03: un cuerpo desmesurado se rechaza (413) antes de validarlo ni ejecutar nada", async () => {
    const execute = vi.fn(async () => ok({}));
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, POST: action({ schema: Schema, execute }) });

    const res = await call(handler, request("POST", { body: { name: "a".repeat(40_000) } }));

    expect(res.statusCode).toBe(413);
    expect(execute).not.toHaveBeenCalled();
  });

  it("SEC-03: ninguna respuesta con datos de una persona se guarda en caché, tampoco los errores", async () => {
    const handler = sessionHandler({ route: "/api/x", getContext: () => context, GET: action({ execute: async () => ok({ a: 1 }) }) });

    expect((await call(handler, request("GET"))).headers).toMatchObject({ "Cache-Control": "no-store" });
    expect((await call(handler, request("GET", { cookie: "sesion=mala" }))).headers).toMatchObject({ "Cache-Control": "no-store" });
  });

  it("opciones de administración: un acceso denegado queda en el log", async () => {
    const denied = vi.fn();
    const handler = sessionHandler({
      route: "/api/x",
      getContext: () => context,
      onDenied: denied,
      GET: action({ execute: async () => err({ code: "FORBIDDEN", message: "Solo admin" }) }),
    });

    const res = await call(handler, request("GET"));

    expect(res.statusCode).toBe(403);
    expect(res.headers).toMatchObject({ "Cache-Control": "no-store" });
    expect(denied).toHaveBeenCalledWith("u1");
  });
});
