import { action, reply, sessionHandler } from "#shared/infrastructure/http/sessionHandler.js";

/**
 * Controlador HTTP — RF-05/RNF-12. Devuelve un JSON descargable (indentado) con
 * todos los datos del usuario de la sesión (nunca los de otro: el id sale de la sesión).
 */
export default sessionHandler({
  route: "/api/accounts/export-data",
  GET: action({
    execute: async ({ context, user }) => {
      const result = await context.exportUserData({ id: user.id, email: user.email });
      if (!result.ok) return reply(400, { error: "No se pudieron exportar los datos" });
      return reply(
        200,
        result.value,
        {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="mylifemirror-mis-datos.json"',
          // Datos personales: que ninguna caché intermedia los guarde.
          "Cache-Control": "no-store",
        },
        { pretty: true },
      );
    },
  }),
});
