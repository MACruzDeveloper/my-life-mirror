import { createRouter } from "../../src/shared/infrastructure/http/router.js";
import aiIdeas from "../../src/shared/infrastructure/http/handlers/accounts/ai-ideas.js";
import deleteAccount from "../../src/shared/infrastructure/http/handlers/accounts/delete-account.js";
import exportData from "../../src/shared/infrastructure/http/handlers/accounts/export-data.js";
import login from "../../src/shared/infrastructure/http/handlers/accounts/login.js";
import logout from "../../src/shared/infrastructure/http/handlers/accounts/logout.js";
import profile from "../../src/shared/infrastructure/http/handlers/accounts/profile.js";
import register from "../../src/shared/infrastructure/http/handlers/accounts/register.js";
import requestPasswordReset from "../../src/shared/infrastructure/http/handlers/accounts/request-password-reset.js";
import resetPassword from "../../src/shared/infrastructure/http/handlers/accounts/reset-password.js";
import session from "../../src/shared/infrastructure/http/handlers/accounts/session.js";

/**
 * Única función serverless de `/api/accounts/*` (plan Hobby de Vercel: máx.
 * 12 funciones). Cada acción sigue siendo un handler independiente en
 * `src/shared/infrastructure/http/handlers/accounts/`.
 */
export default createRouter("/api/accounts/", {
  "ai-ideas": aiIdeas,
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
