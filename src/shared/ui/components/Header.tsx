import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";

export interface HeaderProps {
  /** Nombre del usuario con sesión activa (RF-03), o el email si aún no tiene perfil. Ausente mientras useSesion carga. */
  displayName?: string;
  onCerrarSesion: () => void;
}

/**
 * Cabecera de las páginas protegidas (RF-39): logo (texto, sin imagen todavía),
 * un único enlace de navegación ("Mi perfil" — Perfil y Categorías viven
 * dentro, como pestañas de AccountPage), usuario con sesión activa,
 * selector de idioma (RNF-10) y cierre de sesión. Mobile-first (ADR-07 §6):
 * `displayName` se oculta en móvil (`xs`) para dejar sitio a las acciones.
 */
export function Header({ displayName, onCerrarSesion }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const esEspanol = i18n.language.startsWith("es");

  function alternarIdioma() {
    void i18n.changeLanguage(esEspanol ? "en" : "es");
  }

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          MyLifeMirror
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          <Button size="small" component={RouterLink} to="/perfil">
            {t("breadcrumbs.miPerfil")}
          </Button>
          {displayName ? (
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              {displayName}
            </Typography>
          ) : null}
          <Button size="small" onClick={alternarIdioma}>
            {esEspanol ? "EN" : "ES"}
          </Button>
          <Button size="small" variant="outlined" onClick={onCerrarSesion}>
            {t("panel.cerrarSesion")}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
