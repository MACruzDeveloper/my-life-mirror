import { adminHandler } from "./adminHandler.js";

/** GET /api/admin/users — ADM-01. Lista de usuarios (sin datos de contenido). Solo admin. */
export default adminHandler({
  route: "/api/admin/users",
  method: "GET",
  execute: (context, actor) => context.listUsers(actor),
});
