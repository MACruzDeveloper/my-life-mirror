import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";

/**
 * Indicador de carga de una pantalla entera. La separación va con relleno (`pt`), no con margen:
 * un margen superior colapsa hasta el `body` y, al llegar el contenido, toda la página saltaba 64 px
 * (CLS de 1,0 en Lighthouse, 18 oct.).
 */
export function PageLoader() {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
      <CircularProgress aria-label={t("comun.cargando")} />
    </Box>
  );
}
