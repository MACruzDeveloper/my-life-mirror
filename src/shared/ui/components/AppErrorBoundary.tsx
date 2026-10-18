import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import { LoadErrorBoundary } from "./LoadErrorBoundary";

/** Lo que se ve si una pantalla falla al pintarse: qué ha pasado y cómo seguir. */
function AppErrorFallback() {
  const { t } = useTranslation();
  return (
    <Box
      component="main"
      sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, px: 2, textAlign: "center" }}
    >
      <Typography variant="h5" component="h1">
        {t("errorApp.titulo")}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
        {t("errorApp.texto")}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 1 }}>
        <Button variant="contained" color="secondary" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
          {t("errorApp.recargar")}
        </Button>
        {/* Un enlace normal, no del router: la recarga completa restablece también el límite de errores. */}
        <Button variant="outlined" color="secondary" href="/">
          {t("errorApp.irInicio")}
        </Button>
      </Box>
    </Box>
  );
}

/**
 * UX-14: límite de errores de toda la app. Sin él, un fallo al pintar cualquier pantalla deja la
 * página en blanco (React desmonta todo). Las partes que se cargan aparte conservan su propio
 * `LoadErrorBoundary`, para que un fallo ahí no tumbe el resto. El error queda en la consola; no se
 * envía a ningún servicio externo (ADR-08, apartado 4).
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <LoadErrorBoundary fallback={<AppErrorFallback />}>{children}</LoadErrorBoundary>;
}
