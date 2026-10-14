import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { CHART_ACCENT, headerTheme } from "../theme";
import { useHeaderExtras } from "../context/HeaderExtrasContext";
import { UserAvatar } from "./UserAvatar";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface HeaderProps {
  /** Nombre del usuario con sesión activa (RF-03), o el email si aún no tiene perfil. Ausente mientras useSesion carga. */
  displayName?: string;
  /** RF-26: el avatar elegido, junto al nombre. */
  avatarKey?: string;
  onLogout: () => void;
  /** Solo muestra el enlace: la protección real de /admin está en el servidor (ADM-01). */
  isAdmin?: boolean;
}

/** Las páginas de la cabecera. Mi perfil y Administración van en el menú de la cuenta. */
const PAGES = [
  { path: "/inicio", labelKey: "breadcrumbs.inicio" },
  { path: "/categorias", labelKey: "breadcrumbs.categorias" },
  { path: "/perfil/entrevista", labelKey: "breadcrumbs.entrevista" },
] as const;

/** Separación entre grupos: una línea fina clara sobre el fondo oscuro. */
const GROUP_BORDER = "rgba(242, 242, 242, 0.28)";

/**
 * Elementos de la cabecera que ocupan toda su altura y sin esquinas
 * redondeadas: al pasar el ratón, el resaltado va de arriba abajo.
 */
const FULL_HEIGHT_SX = { alignSelf: "stretch", borderRadius: 0, px: 2, minWidth: 0 };

/**
 * Cabecera de las páginas protegidas (RF-39). En escritorio, cuatro grupos:
 * páginas (Inicio, Categorías y Entrevista), la cuenta (avatar y nombre, que
 * abren un menú con Mi perfil, Administración si es admin y Cerrar sesión),
 * el idioma (ES | EN, como en la portada) y, a la derecha del todo, los
 * avisos que le pase la ruta (`HeaderExtrasProvider`). Mobile-first (ADR-07
 * apartado 6, UX-03): en móvil, logo, idioma, avisos y un menú con todo lo
 * demás. UX-06: oscura y fija arriba; al bajar se compacta.
 */
export function Header({ displayName, avatarKey, onLogout, isAdmin }: HeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { notifications } = useHeaderExtras();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);
  const isCompact = useScrollTrigger({ disableHysteresis: true, threshold: 16 });

  // Lo común a los dos menús (móvil y cuenta): Mi perfil, Administración y Cerrar sesión.
  const accountItems = [
    <MenuItem key="perfil" component={RouterLink} to="/perfil" onClick={closeMenu}>
      <ListItemIcon>
        <PersonOutlinedIcon fontSize="small" />
      </ListItemIcon>
      {t("breadcrumbs.miPerfil")}
    </MenuItem>,
    ...(isAdmin
      ? [
          <MenuItem key="admin" component={RouterLink} to="/admin" onClick={closeMenu}>
            <ListItemIcon>
              <AdminPanelSettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t("breadcrumbs.administracion")}
          </MenuItem>,
        ]
      : []),
    <Divider key="divider" />,
    <MenuItem
      key="logout"
      onClick={() => {
        closeMenu();
        onLogout();
      }}
    >
      <ListItemIcon>
        <LogoutIcon fontSize="small" />
      </ListItemIcon>
      {t("panel.cerrarSesion")}
    </MenuItem>,
  ];

  return (
    <ThemeProvider theme={headerTheme}>
      {/*
        Fija (no "sticky"): al compactarse baja de altura, y si ocupara sitio en la página, el contenido subiría,
        el desplazamiento volvería a menos de 16 px y la cabecera se agrandaría otra vez, sin parar (fallo visto
        al bajar 1 o 2 px). Fija no ocupa sitio: el hueco lo guarda el espaciador de abajo, de altura constante.
      */}
      <AppBar
        position="fixed"
        elevation={isCompact ? 4 : 0}
        data-compact={isCompact}
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
          transition: "box-shadow 200ms",
          borderBottom: `2px solid ${CHART_ACCENT}`,
          // Letra de los botones: más pequeña en compacto (el logo cambia aparte).
          "& .MuiButton-root": { fontSize: isCompact ? "0.75rem" : "0.8125rem", transition: "font-size 200ms" },
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", alignItems: "stretch", gap: 1, pr: { xs: 0, sm: 0 }, minHeight: { xs: isCompact ? 48 : 56, sm: isCompact ? 48 : 64 }, transition: "min-height 200ms ease" }}>
          <Typography variant="h6" component="span" sx={{ alignSelf: "center", fontWeight: 700, fontSize: isCompact ? "1.05rem" : "1.25rem", transition: "font-size 200ms ease" }}>
            MyLifeMirror
          </Typography>
          {isMobile ? (
            <Box sx={{ display: "flex", alignItems: "stretch" }}>
              <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                <LanguageSwitcher variant="text" showLabel={false} />
              </Box>
              {notifications}
              <IconButton
                aria-label={t("comun.abrirMenu")}
                aria-haspopup="menu"
                aria-expanded={menuAnchor ? "true" : undefined}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{ ...FULL_HEIGHT_SX, color: "inherit" }}
              >
                <MenuIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={closeMenu}>
                {displayName ? (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                    {displayName}
                  </Typography>
                ) : null}
                {displayName ? <Divider /> : null}
                {PAGES.map((page) => (
                  <MenuItem key={page.path} component={RouterLink} to={page.path} onClick={closeMenu}>
                    {t(page.labelKey)}
                  </MenuItem>
                ))}
                <Divider />
                {accountItems}
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "stretch" }}>
              <Box component="nav" aria-label={t("comun.paginas")} sx={{ display: "flex", alignItems: "stretch" }}>
                {PAGES.map((page) => (
                  <Button key={page.path} component={RouterLink} to={page.path} sx={FULL_HEIGHT_SX}>
                    {t(page.labelKey)}
                  </Button>
                ))}
              </Box>
              <Box role="group" aria-label={t("comun.miCuenta")} sx={{ display: "flex", alignItems: "stretch", ml: 1, borderLeft: 1, borderRight: 1, borderColor: GROUP_BORDER }}>
                <Button
                  aria-haspopup="menu"
                  aria-expanded={menuAnchor ? "true" : undefined}
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  endIcon={<ExpandMoreIcon />}
                  sx={{ ...FULL_HEIGHT_SX, gap: 1, textTransform: "none", color: "text.secondary" }}
                >
                  {avatarKey ? <UserAvatar avatarKey={avatarKey} size={32} /> : null}
                  {displayName ?? ""}
                </Button>
                <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={closeMenu} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                  {accountItems}
                </Menu>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", px: 2 }}>
                <LanguageSwitcher variant="text" showLabel={false} />
              </Box>
              {notifications ? <Box sx={{ display: "flex", alignItems: "stretch", borderLeft: 1, borderColor: GROUP_BORDER }}>{notifications}</Box> : null}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box aria-hidden sx={{ height: { xs: 58, sm: 66 }, flexShrink: 0 }} />
    </ThemeProvider>
  );
}
