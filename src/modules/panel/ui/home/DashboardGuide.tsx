import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

const DISMISSED_KEY = "mlm.dashboardGuideDismissed";

// localStorage puede fallar (modo privado estricto): entonces la guía se cierra solo durante la visita.
function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // No es crítico: se volverá a mostrar en la próxima visita.
  }
}

/**
 * UX-01. "Cómo leer esta página": qué es cada parte del panel. Se cierra con
 * "Entendido" y no vuelve sola en ese dispositivo; un botón la reabre. Los
 * nombres de las partes se interpolan desde sus propias claves para que la
 * guía no se desfase si un título cambia.
 */
export function DashboardGuide() {
  const { t } = useTranslation();
  const headingId = useId();
  const [open, setOpen] = useState(() => !readDismissed());

  if (!open) {
    return (
      <Box>
        <Button variant="text" size="small" onClick={() => setOpen(true)} sx={{ px: 0 }}>
          {t("guia.panelTitulo")}
        </Button>
      </Box>
    );
  }

  const points = t("guia.panelPuntos", {
    returnObjects: true,
    equilibrio: t("equilibrio.titulo"),
    evolucion: t("evolucion.titulo"),
    idea: t("recomendaciones.titulo"),
    actualizar: t("entrevista.actualizarRespuestas"),
  }) as string[];

  return (
    <Box component="section" aria-labelledby={headingId} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#E9EEF1" }}>
      <Typography id={headingId} variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("guia.panelTitulo")}
      </Typography>
      <Box component="ul" sx={{ my: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {points.map((point) => (
          <Typography component="li" variant="body2" key={point}>
            {point}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            saveDismissed();
            setOpen(false);
          }}
        >
          {t("guia.entendido")}
        </Button>
      </Box>
    </Box>
  );
}
