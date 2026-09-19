import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { ScoreCards, type LatestScoreDto } from "@modules/assessments/ui/ScoreCards";

type Estado = { tipo: "cargando" } | { tipo: "listo"; resultados: LatestScoreDto[] } | { tipo: "error" };

/**
 * Página de inicio tras el login (RF-39). Primera vez (todavía sin ninguna
 * puntuación): bienvenida con un enlace grande a la entrevista, que es el
 * primer paso. Después: directo al panel, que por ahora son las tarjetas de
 * resultados — RF-14 (gráficos) las sustituirá aquí.
 */
export function Home() {
  const { t } = useTranslation();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    let cancelado = false;

    fetch("/api/assessments")
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error("fallo");
        return (await respuesta.json()) as LatestScoreDto[];
      })
      .then((resultados) => {
        if (!cancelado) setEstado({ tipo: "listo", resultados });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  if (estado.tipo === "cargando") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const primeraVez = estado.tipo === "listo" && !estado.resultados.some((r) => r.score !== undefined);

  if (estado.tipo === "error" || primeraVez) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", mt: { xs: 4, sm: 8 }, textAlign: "center", px: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("panel.bienvenidaTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {t("panel.bienvenidaTexto")}
        </Typography>
        {estado.tipo === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("resultados.errorCarga")}
          </Alert>
        )}
        <Button component={RouterLink} to="/perfil/entrevista" variant="contained" size="large" sx={{ px: 5, py: 1.5, fontSize: "1.1rem", borderRadius: 3 }}>
          {t("panel.empezar")}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", mt: 3, px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h1">
          {t("panel.bienvenida")}
        </Typography>
        <Button component={RouterLink} to="/perfil/entrevista" variant="contained">
          {t("panel.nuevaEntrevista")}
        </Button>
      </Box>
      <ScoreCards resultados={estado.resultados} />
    </Box>
  );
}
