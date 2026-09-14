import type { IncomingMessage, ServerResponse } from "node:http";

/** Borra la cookie de sesión — no hace falta invalidar el token en Supabase para el Ciclo 1. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Método no permitido" }));
    return;
  }

  const cookie = ["sesion=", "HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=0"].join("; ");
  res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": cookie });
  res.end(JSON.stringify({ ok: true }));
}
