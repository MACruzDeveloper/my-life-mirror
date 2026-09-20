import { z } from "zod";
import { adminHandler } from "./adminHandler";

const userId = z.string().min(1);
const password = z.string();

/** Acciones POST de ADM-03 sobre cuentas de otros usuarios. Cada una delega en `AdminUserActions`. */
export const changeRole = adminHandler({
  ruta: "/api/admin/user-role",
  metodo: "POST",
  schema: z.object({ userId, rol: z.enum(["usuario", "premium", "admin"]), password }),
  ejecutar: (c, actor, body) => c.adminUsers.changeRole({ actor, ...body }),
});

export const suspendUser = adminHandler({
  ruta: "/api/admin/user-suspend",
  metodo: "POST",
  schema: z.object({ userId, password }),
  ejecutar: (c, actor, body) => c.adminUsers.suspendUser({ actor, ...body }),
});

export const reactivateUser = adminHandler({
  ruta: "/api/admin/user-reactivate",
  metodo: "POST",
  schema: z.object({ userId }),
  ejecutar: (c, actor, body) => c.adminUsers.reactivateUser({ actor, ...body }),
});

export const deleteUser = adminHandler({
  ruta: "/api/admin/user-delete",
  metodo: "POST",
  schema: z.object({ userId, password }),
  ejecutar: (c, actor, body) => c.adminUsers.deleteUser({ actor, ...body }),
});

export const updateEmail = adminHandler({
  ruta: "/api/admin/user-email",
  metodo: "POST",
  schema: z.object({ userId, email: z.string(), password }),
  ejecutar: (c, actor, body) => c.adminUsers.updateEmail({ actor, ...body }),
});

export const updateName = adminHandler({
  ruta: "/api/admin/user-name",
  metodo: "POST",
  schema: z.object({ userId, name: z.string() }),
  ejecutar: (c, actor, body) => c.adminUsers.updateName({ actor, ...body }),
});

export const createUser = adminHandler({
  ruta: "/api/admin/user-create",
  metodo: "POST",
  schema: z.object({ email: z.string(), name: z.string() }),
  ejecutar: (c, actor, body) => c.adminUsers.createUser({ actor, ...body }),
});

export const sendRecoveryLink = adminHandler({
  ruta: "/api/admin/user-recovery",
  metodo: "POST",
  schema: z.object({ userId }),
  ejecutar: (c, actor, body) => c.adminUsers.sendRecoveryLink({ actor, ...body }),
});
