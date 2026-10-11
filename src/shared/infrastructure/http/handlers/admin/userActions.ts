import { z } from "zod";
import { USER_ROLES } from "#modules/accounts/domain/UserRole.js";
import { adminHandler } from "./adminHandler.js";
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, MAX_PASSWORD_INPUT_LENGTH, MAX_TOKEN_LENGTH } from "#shared/infrastructure/http/authLimits.js";

const userId = z.string().min(1).max(MAX_TOKEN_LENGTH);
const password = z.string().max(MAX_PASSWORD_INPUT_LENGTH);

/** Acciones POST de ADM-03 sobre cuentas de otros usuarios. Cada una delega en `AdminUserActions`. */
export const changeRole = adminHandler({
  route: "/api/admin/user-role",
  method: "POST",
  schema: z.object({ userId, rol: z.enum(USER_ROLES), password }),
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
  schema: z.object({ userId, email: z.string().max(MAX_EMAIL_LENGTH), password }),
  execute: (c, actor, body) => c.adminUsers.updateEmail({ actor, ...body }),
});

export const updateName = adminHandler({
  route: "/api/admin/user-name",
  method: "POST",
  schema: z.object({ userId, name: z.string().max(MAX_NAME_LENGTH) }),
  execute: (c, actor, body) => c.adminUsers.updateName({ actor, ...body }),
});

export const createUser = adminHandler({
  route: "/api/admin/user-create",
  method: "POST",
  schema: z.object({ email: z.string().max(MAX_EMAIL_LENGTH), name: z.string().max(MAX_NAME_LENGTH) }),
  execute: (c, actor, body) => c.adminUsers.createUser({ actor, ...body }),
});

export const sendRecoveryLink = adminHandler({
  route: "/api/admin/user-recovery",
  method: "POST",
  schema: z.object({ userId }),
  execute: (c, actor, body) => c.adminUsers.sendRecoveryLink({ actor, ...body }),
});
