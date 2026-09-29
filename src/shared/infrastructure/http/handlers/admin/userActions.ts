import { z } from "zod";
import { adminHandler } from "./adminHandler.js";

const userId = z.string().min(1);
const password = z.string();

/** Acciones POST de ADM-03 sobre cuentas de otros usuarios. Cada una delega en `AdminUserActions`. */
export const changeRole = adminHandler({
  route: "/api/admin/user-role",
  method: "POST",
  schema: z.object({ userId, rol: z.enum(["usuario", "premium", "admin"]), password }),
  execute: (c, actor, body) => c.adminUsers.changeRole({ actor, ...body }),
});

export const suspendUser = adminHandler({
  route: "/api/admin/user-suspend",
  method: "POST",
  schema: z.object({ userId, password }),
  execute: (c, actor, body) => c.adminUsers.suspendUser({ actor, ...body }),
});

export const reactivateUser = adminHandler({
  route: "/api/admin/user-reactivate",
  method: "POST",
  schema: z.object({ userId }),
  execute: (c, actor, body) => c.adminUsers.reactivateUser({ actor, ...body }),
});

export const deleteUser = adminHandler({
  route: "/api/admin/user-delete",
  method: "POST",
  schema: z.object({ userId, password }),
  execute: (c, actor, body) => c.adminUsers.deleteUser({ actor, ...body }),
});

export const updateEmail = adminHandler({
  route: "/api/admin/user-email",
  method: "POST",
  schema: z.object({ userId, email: z.string(), password }),
  execute: (c, actor, body) => c.adminUsers.updateEmail({ actor, ...body }),
});

export const updateName = adminHandler({
  route: "/api/admin/user-name",
  method: "POST",
  schema: z.object({ userId, name: z.string() }),
  execute: (c, actor, body) => c.adminUsers.updateName({ actor, ...body }),
});

export const createUser = adminHandler({
  route: "/api/admin/user-create",
  method: "POST",
  schema: z.object({ email: z.string(), name: z.string() }),
  execute: (c, actor, body) => c.adminUsers.createUser({ actor, ...body }),
});

export const sendRecoveryLink = adminHandler({
  route: "/api/admin/user-recovery",
  method: "POST",
  schema: z.object({ userId }),
  execute: (c, actor, body) => c.adminUsers.sendRecoveryLink({ actor, ...body }),
});
