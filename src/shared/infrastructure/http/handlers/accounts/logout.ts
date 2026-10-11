import type { IncomingMessage, ServerResponse } from "node:http";
import { clearedSessionCookie } from "#shared/infrastructure/cookies.js";

/** Borra la cookie de sesión — no hace falta invalidar el token en Supabase para el Ciclo 1. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ error: "Método no permitido" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", "Set-Cookie": clearedSessionCookie() });
  res.end(JSON.stringify({ ok: true }));
}
