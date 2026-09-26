import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";

/** Primera vez (todavía sin ninguna puntuación): en vez de un panel vacío, una invitación grande a la entrevista. */
export function FirstTimeWelcome() {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: { xs: 4, sm: 8 }, textAlign: "center", px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("panel.bienvenidaTitulo")}
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        {t("panel.bienvenidaTexto")}
      </Typography>
      <Button component={RouterLink} to="/perfil/entrevista" variant="contained" size="large" sx={{ px: 5, py: 1.5, fontSize: "1.1rem", borderRadius: 3 }}>
        {t("panel.empezar")}
      </Button>
    </Box>
  );
}
