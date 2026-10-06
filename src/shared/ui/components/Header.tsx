import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { headerTheme } from "../theme";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface HeaderProps {
  /** Nombre del usuario con sesión activa (RF-03), o el email si aún no tiene perfil. Ausente mientras useSesion carga. */
  displayName?: string;
  onLogout: () => void;
  /** Solo muestra el enlace: la protección real de /admin está en el servidor (ADM-01). */
  isAdmin?: boolean;
}

/**
 * Cabecera de las páginas protegidas (RF-39): logo (texto, sin imagen todavía),
 * enlaces de navegación ("Inicio" — el panel —, "Administración" solo para
 * admin, y "Mi perfil" — Perfil, Entrevista, Resultados y Privacidad viven
 * dentro, en el menú lateral de AccountPage), usuario con sesión activa,
 * selector de idioma (RNF-10) y cierre de sesión. Mobile-first (ADR-07 apartado 6,
 * UX-03): en móvil, logo + idioma + un menú con la navegación, el nombre y
 * cerrar sesión; desde `sm`, todo en línea. UX-06: oscura y fija arriba; al
 * bajar se compacta (menos altura y letra más pequeña) con una transición breve.
 */
export function Header({ displayName, onLogout, isAdmin }: HeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);
  const isCompact = useScrollTrigger({ disableHysteresis: true, threshold: 16 });

  return (
    <ThemeProvider theme={headerTheme}>
    <AppBar
      position="sticky"
      elevation={isCompact ? 4 : 0}
      data-compact={isCompact}
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        transition: "box-shadow 200ms",
        // Letra de los botones: más pequeña en compacto (el logo cambia aparte).
        "& .MuiButton-root": { fontSize: isCompact ? "0.75rem" : "0.8125rem", transition: "font-size 200ms" },
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", gap: 1, minHeight: { xs: isCompact ? 48 : 56, sm: isCompact ? 48 : 64 }, transition: "min-height 200ms ease" }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: isCompact ? "1.05rem" : "1.25rem", transition: "font-size 200ms ease" }}>
          MyLifeMirror
        </Typography>
        {isMobile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LanguageSwitcher />
            <IconButton
              aria-label={t("comun.abrirMenu")}
              aria-haspopup="menu"
              aria-expanded={menuAnchor ? "true" : undefined}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
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
              <MenuItem component={RouterLink} to="/inicio" onClick={closeMenu}>
                {t("breadcrumbs.inicio")}
              </MenuItem>
              {isAdmin ? (
                <MenuItem component={RouterLink} to="/admin" onClick={closeMenu}>
                  {t("breadcrumbs.administracion")}
                </MenuItem>
              ) : null}
              <MenuItem component={RouterLink} to="/perfil" onClick={closeMenu}>
                {t("breadcrumbs.miPerfil")}
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                {t("panel.cerrarSesion")}
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Button size="small" component={RouterLink} to="/inicio">
              {t("breadcrumbs.inicio")}
            </Button>
            {isAdmin ? (
              <Button size="small" component={RouterLink} to="/admin">
                {t("breadcrumbs.administracion")}
              </Button>
            ) : null}
            <Button size="small" component={RouterLink} to="/perfil">
              {t("breadcrumbs.miPerfil")}
            </Button>
            {displayName ? (
              <Typography variant="body2" color="text.secondary">
                {displayName}
              </Typography>
            ) : null}
            <LanguageSwitcher />
            <Tooltip title={t("panel.cerrarSesion")}>
              <IconButton size="small" aria-label={t("panel.cerrarSesion")} onClick={onLogout}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
    </ThemeProvider>
  );
}
