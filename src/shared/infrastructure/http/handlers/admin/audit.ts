import { adminHandler } from "./adminHandler.js";

/** GET /api/admin/audit — ADM-03. Últimas anotaciones de auditoría. Solo admin. */
export default adminHandler({
  route: "/api/admin/audit",
  method: "GET",
  execute: (context, actor) => context.adminUsers.listAudit(actor),
});
