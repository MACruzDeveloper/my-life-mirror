import { createRouter } from "#shared/infrastructure/http/router.js";
import audit from "#shared/infrastructure/http/handlers/admin/audit.js";
import users from "#shared/infrastructure/http/handlers/admin/users.js";
import {
  changeRole,
  createUser,
  deleteUser,
  reactivateUser,
  sendRecoveryLink,
  suspendUser,
  updateEmail,
  updateName,
} from "#shared/infrastructure/http/handlers/admin/userActions.js";

/**
 * Única función serverless de `/api/admin/*` salvo el catálogo de categorías
 * (`admin/categories/`, ADM-02). Ver createRouter sobre el límite de 12 funciones.
 * Todas exigen rol admin en el servidor (sesión verificada + caso de uso).
 */
export default createRouter("/api/admin/", {
  users,
  audit,
  "user-role": changeRole,
  "user-suspend": suspendUser,
  "user-reactivate": reactivateUser,
  "user-delete": deleteUser,
  "user-email": updateEmail,
  "user-name": updateName,
  "user-create": createUser,
  "user-recovery": sendRecoveryLink,
});
