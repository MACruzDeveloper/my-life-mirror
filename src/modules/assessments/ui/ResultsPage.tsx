import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { ScoreCards, type LatestScoreDto } from "./ScoreCards";

type Estado = { tipo: "cargando" } | { tipo: "listo"; resultados: LatestScoreDto[] } | { tipo: "error" };

/** Última puntuación de cada categoría activa (precursor mínimo de RF-14). */
export function ResultsPage() {
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

  if (estado.tipo === "error") {
    return <Alert severity="error">{t("resultados.errorCarga")}</Alert>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" component="h1">
        {t("resultados.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("resultados.descripcion")}
      </Typography>
      {estado.resultados.length === 0 ? (
        <Typography>{t("resultados.sinCategorias")}</Typography>
      ) : (
        <ScoreCards resultados={estado.resultados} />
      )}
      <Link component={RouterLink} to="/perfil/entrevista">
        {t("resultados.empezar")}
      </Link>
    </Box>
  );
}
