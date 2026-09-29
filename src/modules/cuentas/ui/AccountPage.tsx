import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Outlet, useLocation } from "react-router";

const ANCHO_MENU = 220;

const SECCIONES = [
  { ruta: "/perfil", clave: "cuenta.perfil" },
  { ruta: "/perfil/entrevista", clave: "cuenta.entrevista" },
  { ruta: "/perfil/resultados", clave: "cuenta.resultados" },
  { ruta: "/perfil/datos", clave: "cuenta.datos" },
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
  const [abierto, setAbierto] = useState(false);

  const menu = (
    <List component="nav" aria-label={t("cuenta.menu")} sx={{ width: ANCHO_MENU, pt: 2 }}>
      {SECCIONES.map(({ ruta, clave }) => (
        <ListItemButton
          key={ruta}
          component={RouterLink}
          to={ruta}
          selected={pathname === ruta}
          aria-current={pathname === ruta ? "page" : undefined}
          onClick={() => setAbierto(false)}
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
      <Drawer open={abierto} onClose={() => setAbierto(false)} sx={{ display: { md: "none" } }}>
        {menu}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: 1180 }}>
        <Button onClick={() => setAbierto(true)} sx={{ display: { md: "none" }, mb: 1 }}>
          {t("cuenta.menu")}
        </Button>
        <Outlet />
      </Box>
    </Box>
  );
}
