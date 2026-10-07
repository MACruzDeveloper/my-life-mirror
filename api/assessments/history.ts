import { action, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/** Controlador HTTP — RF-10. Historial de guardados del propio usuario. */
export default sessionHandler({
  route: "/api/assessments/history",
  GET: action({ execute: ({ context, user }) => context.getAssessmentHistory(user.id) }),
});
