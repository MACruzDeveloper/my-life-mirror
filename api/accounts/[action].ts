import { createRouter } from "#shared/infrastructure/http/router.js";
import aiIdeas from "#shared/infrastructure/http/handlers/accounts/ai-ideas.js";
import deleteAccount from "#shared/infrastructure/http/handlers/accounts/delete-account.js";
import exportData from "#shared/infrastructure/http/handlers/accounts/export-data.js";
import login from "#shared/infrastructure/http/handlers/accounts/login.js";
import logout from "#shared/infrastructure/http/handlers/accounts/logout.js";
import profile from "#shared/infrastructure/http/handlers/accounts/profile.js";
import register from "#shared/infrastructure/http/handlers/accounts/register.js";
import requestPasswordReset from "#shared/infrastructure/http/handlers/accounts/request-password-reset.js";
import resetPassword from "#shared/infrastructure/http/handlers/accounts/reset-password.js";
import session from "#shared/infrastructure/http/handlers/accounts/session.js";

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
