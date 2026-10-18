import type { IncomingMessage, ServerResponse } from "node:http";
import { clearedSessionCookies } from "#shared/infrastructure/cookies.js";

/** Borra las dos cookies de sesión (SEC-05). El token de acceso caduca solo en una hora y, sin su cookie, el de renovación ya no llega a usarse. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ error: "Método no permitido" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", "Set-Cookie": clearedSessionCookies() });
  res.end(JSON.stringify({ ok: true }));
}
