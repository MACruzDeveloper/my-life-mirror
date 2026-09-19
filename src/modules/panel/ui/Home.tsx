import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/** Placeholder mínimo tras iniciar sesión (RF-39) — el panel real es RF-14 (tablero, "Listo"). */
export function Home() {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, textAlign: "center", px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("panel.bienvenida")}
      </Typography>
      <Typography variant="body1">{t("panel.descripcion")}</Typography>
    </Box>
  );
}
