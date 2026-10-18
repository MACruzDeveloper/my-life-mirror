import { describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { z } from "zod";
import { err, ok } from "@shared/domain/Result";

const resumeSession = vi.fn(async () => ok({ user: { id: "u1", email: "ana@ejemplo.com", rol: "usuario" } }));
vi.mock("@shared/infrastructure/container", () => ({ getAppContext: () => ({ resumeSession }) }));
const warn = vi.fn();
vi.mock("@shared/infrastructure/logger", () => ({ logger: { warn, error: vi.fn(), info: vi.fn() } }));

const { adminHandler } = await import("@shared/infrastructure/http/handlers/admin/adminHandler");

function fakeResponse() {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: undefined as unknown, writeHead: vi.fn(), end: vi.fn() };
  res.writeHead.mockImplementation((status: number, headers: Record<string, string>) => Object.assign(res, { statusCode: status, headers }));
  res.end.mockImplementation((chunk: string) => Object.assign(res, { body: JSON.parse(chunk) }));
  return res as typeof res & ServerResponse;
}

const request = (method: string, body?: unknown) => ({ method, url: "/api/admin/x", headers: { cookie: "sesion=ok" }, body }) as never;

describe("adminHandler (ADM-03) sobre la plantilla común", () => {
  it("ejecuta con el actor de la sesión y el cuerpo validado, sin caché intermedia", async () => {
    const execute = vi.fn(async (_context: unknown, actor: { id: string }, body: { userId: string }) => ok({ actor: actor.id, target: body.userId }));
    const handler = adminHandler({ route: "/api/admin/x", method: "POST", schema: z.object({ userId: z.string() }), execute });
    const res = fakeResponse();

    await handler(request("POST", { userId: "u2" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ actor: "u1", target: "u2" });
    expect(res.headers).toMatchObject({ "Cache-Control": "no-store" });
  });

  it("sin permiso: 403 con su código, y queda en el log", async () => {
    const handler = adminHandler({ route: "/api/admin/x", method: "GET", execute: async () => err({ code: "FORBIDDEN", message: "Solo admin" }) });
    const res = fakeResponse();

    await handler(request("GET"), res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Solo admin", code: "FORBIDDEN" });
    expect(warn).toHaveBeenCalledWith("Acceso de administración denegado", { route: "/api/admin/x", userId: "u1" });
  });

  it("solo su método", async () => {
    const handler = adminHandler({ route: "/api/admin/x", method: "GET", execute: async () => ok([]) });
    const res = fakeResponse();

    await handler(request("POST"), res);

    expect(res.statusCode).toBe(405);
  });
});
