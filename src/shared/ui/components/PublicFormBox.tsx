import Box, { type BoxProps } from "@mui/material/Box";

/**
 * Contenedor de las páginas públicas de cuenta (registro, login, recuperar y
 * restablecer contraseña). Mobile-first (RNF-06, ADR-07 §6): en móvil deja el
 * margen lateral de 16 px que antes faltaba (los campos tocaban el borde) y
 * queda alineado con `Breadcrumbs`, que usa la misma anchura y el mismo
 * margen; desde `sm`, algo más de aire arriba.
 */
export function PublicFormBox({ sx, ...props }: BoxProps) {
  return <Box {...props} sx={[{ maxWidth: 360, mx: "auto", mt: { xs: 3, sm: 5 }, px: 2 }, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
