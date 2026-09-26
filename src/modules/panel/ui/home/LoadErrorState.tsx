import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/**
 * Fallo al cargar las puntuaciones. Distinto de "primera vez" a propósito: un
 * fallo técnico no es un usuario nuevo, y la bienvenida sería engañosa aquí.
 */
export function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, textAlign: "center", px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("panel.bienvenida")}
      </Typography>
      <Alert severity="error" sx={{ mb: 2 }}>
        {t("resultados.errorCarga")}
      </Alert>
      <Button variant="outlined" onClick={onRetry}>
        {t("comun.reintentar")}
      </Button>
    </Box>
  );
}
