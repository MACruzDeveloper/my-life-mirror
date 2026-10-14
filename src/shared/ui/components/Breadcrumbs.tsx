import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { PUBLIC_FORM_MAX_WIDTH } from "./PublicFormBox";

/** El ancho del contenido de las páginas protegidas; las migas se alinean con él. */
export const PAGE_MAX_WIDTH = 1100;
/** Las páginas con menú lateral (Mi perfil) son más anchas. */
export const WIDE_PAGE_MAX_WIDTH = 1440;

export interface BreadcrumbItem {
  /** Texto a mostrar — ya traducido por quien construye la lista (t(...)). */
  label: string;
  /** Ruta a la que enlaza. Si se omite, se trata como la página actual (texto plano, sin enlace). */
  path?: string;
}

/**
 * Breadcrumbs reutilizable para todo el proyecto (navegación "volver a" + orientación).
 * El último elemento sin `ruta` se pinta como texto — es la página actual.
 * `align`: centrado (por defecto) para alinearse con los formularios públicos (`PublicFormBox`, mismo ancho);
 * "start" en las pantallas protegidas: dentro del contenedor de la página, alineadas con su contenido.
 */
export function Breadcrumbs({ items, align = "center", maxWidth = PAGE_MAX_WIDTH }: { items: BreadcrumbItem[]; align?: "center" | "start"; /** Ancho del contenedor de la página ("start"). */ maxWidth?: number }) {
  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={[{ mt: 2, px: 2 }, align === "center" ? { maxWidth: PUBLIC_FORM_MAX_WIDTH, mx: "auto" } : { maxWidth, mx: "auto" }]}>
      {items.map((item) =>
        item.path ? (
          <Link key={item.label} component={RouterLink} to={item.path} underline="hover" color="inherit">
            {item.label}
          </Link>
        ) : (
          <Typography key={item.label} color="text.primary">
            {item.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
