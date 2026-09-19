import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";

export interface MigaDePan {
  /** Texto a mostrar — ya traducido por quien construye la lista (t(...)). */
  etiqueta: string;
  /** Ruta a la que enlaza. Si se omite, se trata como la página actual (texto plano, sin enlace). */
  ruta?: string;
}

/**
 * Breadcrumbs reutilizable para todo el proyecto (navegación "volver a" + orientación).
 * El último elemento sin `ruta` se pinta como texto — es la página actual.
 */
export function Breadcrumbs({ items }: { items: MigaDePan[] }) {
  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ maxWidth: 360, mx: "auto", mt: 2, px: 2 }}>
      {items.map((item) =>
        item.ruta ? (
          <Link key={item.etiqueta} component={RouterLink} to={item.ruta} underline="hover" color="inherit">
            {item.etiqueta}
          </Link>
        ) : (
          <Typography key={item.etiqueta} color="text.primary">
            {item.etiqueta}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
