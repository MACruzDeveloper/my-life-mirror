import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";

export interface BreadcrumbItem {
  /** Texto a mostrar — ya traducido por quien construye la lista (t(...)). */
  label: string;
  /** Ruta a la que enlaza. Si se omite, se trata como la página actual (texto plano, sin enlace). */
  path?: string;
}

/**
 * Breadcrumbs reutilizable para todo el proyecto (navegación "volver a" + orientación).
 * El último elemento sin `ruta` se pinta como texto — es la página actual.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ maxWidth: 360, mx: "auto", mt: 2, px: 2 }}>
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
