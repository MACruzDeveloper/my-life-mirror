import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export interface HeaderProps {
  /** Email del usuario con sesión activa. Ausente mientras useSesion aún está cargando. */
  email?: string;
  onCerrarSesion: () => void;
}

/**
 * Cabecera de las páginas protegidas (RF-39): logo (texto, sin imagen todavía),
 * usuario con sesión activa, selector de idioma (RNF-10) y cierre de sesión.
 */
export function Header({ email, onCerrarSesion }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const esEspanol = i18n.language.startsWith("es");

  function alternarIdioma() {
    void i18n.changeLanguage(esEspanol ? "en" : "es");
  }

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          MyLifeMirror
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "center" }}>
          {email ? (
            <Typography variant="body2" color="text.secondary">
              {email}
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
