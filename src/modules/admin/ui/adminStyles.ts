import { PALE_TINT } from "@shared/ui/theme";

/** Estilos comunes del panel de administración: todas las pestañas iguales. */

/** Un bloque (formulario, tabla): blanco, con un borde suave y sin esquinas, como el resto de la app. */
export const ADMIN_PANEL_SX = { border: 1, borderColor: "divider", bgcolor: "background.paper" } as const;

/** La cabecera de una tabla: el gris azulado claro de la paleta y los títulos en negrita. */
export const ADMIN_TABLE_HEAD_SX = { bgcolor: PALE_TINT, "& .MuiTableCell-head": { fontWeight: 700 } } as const;

/** El título de un bloque. */
export const ADMIN_BLOCK_TITLE_SX = { fontWeight: 700, mb: 1 } as const;
