import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { useAssessmentHistory } from "@modules/assessments/ui/queries";
import type { LatestScoreDto } from "@modules/assessments/ui/ScoreCards";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import { useRecommendations } from "@modules/recommendations/ui/queries";

/**
 * Los gráficos (Apache ECharts) se cargan solo al llegar al panel: son la mayor
 * parte del peso de la app y la portada, el login o el registro no los usan.
 */
const BalanceCard = lazy(() => import("@modules/assessments/ui/balance/BalanceCard").then((module) => ({ default: module.BalanceCard })));
const EvolutionPanel = lazy(() => import("@modules/assessments/ui/evolution/EvolutionPanel").then((module) => ({ default: module.EvolutionPanel })));

function ChartsFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

/**
 * El panel (RF-14 + RF-15 + RF-16): primero el equilibrio de hoy (radar) y
 * después, una tarjeta por categoría activa con su puntuación actual y su evolución, y el botón de la recomendación abierta si la hay
 * (RF-18). La composición evaluaciones + recomendaciones se hace aquí, no en
 * un caso de uso combinado del servidor (ver la historia de RF-14). Las
 * tarjetas de detalle viven en Resultados.
 */
export function Dashboard({ latestScores }: { latestScores: LatestScoreDto[] }) {
  const { t } = useTranslation();
  // Secundarios respecto a las puntuaciones: si tardan o fallan, el panel se ve igual.
  const recommendations = useRecommendations().data ?? [];
  const history = useAssessmentHistory();

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" component="h1">
          {t("panel.bienvenida")}
        </Typography>
        <Button component={RouterLink} to="/perfil/entrevista" variant="contained">
          {t("entrevista.actualizarRespuestas")}
        </Button>
      </Box>
      <Suspense fallback={<ChartsFallback />}>
        <BalanceCard latestScores={latestScores} />
      </Suspense>
      <Box sx={{ mt: 1 }}>
        <Typography variant="h6" component="h2">
          {t("evolucion.titulo")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("evolucion.descripcion")}
        </Typography>
      </Box>
      <Suspense fallback={<ChartsFallback />}>
        <EvolutionPanel
          latestScores={latestScores}
          sessions={history.data}
          historyError={history.isError}
          renderCardExtra={(categoryId) => {
            const recommendation = recommendations.find((candidate) => candidate.categoryId === categoryId);
            return recommendation ? <RecommendationButton templateKey={recommendation.templateKey} categoryName={recommendation.categoryName} /> : null;
          }}
        />
      </Suspense>
      <Link component={RouterLink} to="/perfil/resultados">
        {t("evolucion.verDetalle")}
      </Link>
    </Box>
  );
}
