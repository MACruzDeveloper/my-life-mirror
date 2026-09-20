import { adminHandler } from "./adminHandler";

/** GET /api/admin/users — ADM-01. Lista de usuarios (sin datos de contenido). Solo admin. */
export default adminHandler({
  ruta: "/api/admin/users",
  metodo: "GET",
  ejecutar: (contexto, actor) => contexto.listUsers(actor),
});
