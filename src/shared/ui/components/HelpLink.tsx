import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useLocation } from "react-router";

/**
 * RF-30: "¿Necesitas ayuda ahora?", hacia las líneas de ayuda. Igual para todo
 * el mundo y siempre a la vista: nunca aparece por algo que el usuario puntúe o
 * escriba (RES-09).
 */
export function HelpLink({ variant = "caption" }: { variant?: "caption" | "body2" }) {
  const { t } = useTranslation();
  return (
    <Link component={RouterLink} to="/ayuda" variant={variant} color="text.secondary" underline="always">
      {t("ayuda.enlace")}
    </Link>
  );
}

/** Pie común de las páginas, públicas y protegidas, con el enlace a la ayuda (salvo en la propia ayuda). */
export function HelpFooter() {
  const { pathname } = useLocation();
  if (pathname === "/ayuda") return null;
  return (
    <Box component="footer" sx={{ display: "flex", justifyContent: "center", px: 2, py: 3 }}>
      <HelpLink />
    </Box>
  );
}
