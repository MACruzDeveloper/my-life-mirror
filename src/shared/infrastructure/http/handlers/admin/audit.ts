import { adminHandler } from "./adminHandler.js";

/** GET /api/admin/audit — ADM-03. Últimas anotaciones de auditoría. Solo admin. */
export default adminHandler({
  ruta: "/api/admin/audit",
  metodo: "GET",
  ejecutar: (contexto, actor) => contexto.adminUsers.listAudit(actor),
});
