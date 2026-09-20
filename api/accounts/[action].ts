import { createRouter } from "../../src/shared/infrastructure/http/router";
import deleteAccount from "../../src/shared/infrastructure/http/handlers/accounts/delete-account";
import exportData from "../../src/shared/infrastructure/http/handlers/accounts/export-data";
import login from "../../src/shared/infrastructure/http/handlers/accounts/login";
import logout from "../../src/shared/infrastructure/http/handlers/accounts/logout";
import profile from "../../src/shared/infrastructure/http/handlers/accounts/profile";
import register from "../../src/shared/infrastructure/http/handlers/accounts/register";
import requestPasswordReset from "../../src/shared/infrastructure/http/handlers/accounts/request-password-reset";
import resetPassword from "../../src/shared/infrastructure/http/handlers/accounts/reset-password";
import session from "../../src/shared/infrastructure/http/handlers/accounts/session";

/**
 * Única función serverless de `/api/accounts/*` (plan Hobby de Vercel: máx.
 * 12 funciones). Cada acción sigue siendo un handler independiente en
 * `src/shared/infrastructure/http/handlers/accounts/`.
 */
export default createRouter("/api/accounts/", {
  "delete-account": deleteAccount,
  "export-data": exportData,
  login,
  logout,
  profile,
  register,
  "request-password-reset": requestPasswordReset,
  "reset-password": resetPassword,
  session,
});
