import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";

/** RF-39. Página pública — sin lógica de dominio, solo introducción + CTAs. */
export function Landing() {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, textAlign: "center", px: 2 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        {t("landing.titulo")}
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        {t("landing.descripcion")}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
        <Button component={RouterLink} to="/registro" variant="contained">
          {t("landing.crearCuenta")}
        </Button>
        <Button component={RouterLink} to="/login" variant="outlined">
          {t("landing.iniciarSesion")}
        </Button>
      </Stack>
    </Box>
  );
}
