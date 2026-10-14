import { useState, type ComponentType } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, Outlet, useLocation } from "react-router";
import { Breadcrumbs, type BreadcrumbItem, WIDE_PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";

const MENU_WIDTH = 220;
const COLLAPSED_WIDTH = 64;
// Preferencia de interfaz de este navegador (como la guía de Inicio), sin valor entre dispositivos.
const COLLAPSED_KEY = "mylifemirror.menuPlegado";

const SECTIONS: { path: string; labelKey: string; Icon: ComponentType<{ fontSize?: "small" }> }[] = [
  { path: "/perfil", labelKey: "cuenta.perfil", Icon: PersonOutlinedIcon },
  { path: "/perfil/entrevista", labelKey: "cuenta.entrevista", Icon: ForumOutlinedIcon },
  { path: "/perfil/resultados", labelKey: "cuenta.resultados", Icon: InsightsOutlinedIcon },
  { path: "/perfil/calendario", labelKey: "cuenta.calendario", Icon: CalendarMonthOutlinedIcon },
  { path: "/perfil/datos", labelKey: "cuenta.datos", Icon: ShieldOutlinedIcon },
];

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  } catch {
    // localStorage puede fallar (modo privado estricto): entonces se pliega solo durante la visita.
  }
}

/**
 * Concentrador de "Mi perfil" con menú lateral: todo lo que el usuario hace
 * sobre sí mismo — perfil, entrevista, resultados, calendario (RF-48) y privacidad/datos (RF-05) —
 * vive aquí. UX-06: el menú es un `Drawer`. En escritorio (md+) está fijo y se
 * puede plegar a solo iconos (se recuerda en este navegador); en móvil se abre
 * con un botón y se cierra al elegir. Rutas anidadas de verdad para que cada
 * sección sea recargable/enlazable directamente.
 */
export function AccountPage({ breadcrumbs = [] }: { /** Van sobre el contenido (a su altura), no sobre el menú. */ breadcrumbs?: BreadcrumbItem[] } = {}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);
  const currentSection = SECTIONS.find((section) => section.path === pathname) ?? SECTIONS[0];

  function toggleCollapsed() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    saveCollapsed(next);
  }

  const menu = (collapsed: boolean) => (
    <List component="nav" aria-label={t("cuenta.menu")} sx={{ width: collapsed ? COLLAPSED_WIDTH : MENU_WIDTH, pt: 1, transition: "width 150ms" }}>
      {SECTIONS.map(({ path, labelKey, Icon }) => {
        const label = t(labelKey);
        const item = (
          <ListItemButton
            key={path}
            component={RouterLink}
            to={path}
            selected={pathname === path}
            aria-current={pathname === path ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            onClick={() => setIsMobileOpen(false)}
            sx={{ borderRadius: 2, mx: 1, minHeight: 44, justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            {!collapsed && <ListItemText primary={label} />}
          </ListItemButton>
        );
        return collapsed ? (
          <Tooltip key={path} title={label} placement="right">
            {item}
          </Tooltip>
        ) : (
          item
        );
      })}
    </List>
  );

  return (
    // En rejilla: arriba, las migas sobre el contenido; debajo, el menú y el contenido empezando a la misma altura.
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "auto minmax(0, 1fr)" },
        gridTemplateAreas: { xs: '"crumbs" "content"', md: '". crumbs" "menu content"' },
        columnGap: { md: 5 },
        alignItems: "start",
        px: 2,
        mt: 2,
        maxWidth: WIDE_PAGE_MAX_WIDTH,
        mx: "auto",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          gridArea: "menu",
          display: { xs: "none", md: "block" },
          flexShrink: 0,
          // Dentro del flujo de la página (no fijo a la ventana) y, al desplazarse, por debajo de la
          // cabecera fija: el z-index de un Drawer es mayor que el del AppBar.
          "& .MuiDrawer-paper": { position: "relative", zIndex: (theme) => theme.zIndex.appBar - 1, border: 0, borderRight: 1, borderColor: "divider", minHeight: 360, overflowX: "hidden" },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: isCollapsed ? "center" : "flex-end", px: 1, pt: 1.5 }}>
          <IconButton size="small" aria-label={isCollapsed ? t("cuenta.desplegarMenu") : t("cuenta.plegarMenu")} aria-expanded={!isCollapsed} onClick={toggleCollapsed}>
            {isCollapsed ? <MenuIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Box>
        {menu(isCollapsed)}
      </Drawer>
      <Drawer open={isMobileOpen} onClose={() => setIsMobileOpen(false)} sx={{ display: { md: "none" } }}>
        {menu(false)}
      </Drawer>
      <Box sx={{ gridArea: "crumbs", minWidth: 0 }}>{breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} align="inline" />}</Box>
      <Box sx={{ gridArea: "content", minWidth: 0, maxWidth: 1180 }}>
        <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", p: { xs: 2, md: 4 }, minHeight: 360 }}>
        {/* Con el nombre de la sección actual: no se confunde con el menú de la cabecera. */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<MenuIcon />}
          aria-label={t("cuenta.menu")}
          onClick={() => setIsMobileOpen(true)}
          sx={{ display: { md: "none" }, mb: 1.5, borderRadius: 999, textTransform: "none" }}
        >
          {t(currentSection.labelKey)}
        </Button>
        <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
