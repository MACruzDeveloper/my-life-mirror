import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Outlet, useLocation } from "react-router";

const MENU_WIDTH = 220;

const SECTIONS = [
  { path: "/perfil", labelKey: "cuenta.perfil" },
  { path: "/perfil/entrevista", labelKey: "cuenta.entrevista" },
  { path: "/perfil/resultados", labelKey: "cuenta.resultados" },
  { path: "/perfil/datos", labelKey: "cuenta.datos" },
];

/**
 * Concentrador de "Mi perfil" con menú lateral (antes eran pestañas): todo lo
 * que el usuario hace sobre sí mismo — perfil, entrevista,
 * resultados y privacidad/datos (RF-05) — vive aquí. En escritorio/tablet (md+) el menú es fijo a la
 * izquierda; en móvil se abre como cajón con un botón. Rutas anidadas de
 * verdad para que cada sección sea recargable/enlazable directamente.
 */
export function AccountPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menu = (
    <List component="nav" aria-label={t("cuenta.menu")} sx={{ width: MENU_WIDTH, pt: 2 }}>
      {SECTIONS.map(({ path: ruta, labelKey: clave }) => (
        <ListItemButton
          key={ruta}
          component={RouterLink}
          to={ruta}
          selected={pathname === ruta}
          aria-current={pathname === ruta ? "page" : undefined}
          onClick={() => setIsOpen(false)}
          sx={{ borderRadius: 2, mx: 1 }}
        >
          <ListItemText primary={t(clave)} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: { md: 3 }, px: 2, mt: 2 }}>
      <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0, borderRight: 1, borderColor: "divider", minHeight: 360 }}>{menu}</Box>
      <Drawer open={isOpen} onClose={() => setIsOpen(false)} sx={{ display: { md: "none" } }}>
        {menu}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: 1180 }}>
        <Button onClick={() => setIsOpen(true)} sx={{ display: { md: "none" }, mb: 1 }}>
          {t("cuenta.menu")}
        </Button>
        <Outlet />
      </Box>
    </Box>
  );
}
