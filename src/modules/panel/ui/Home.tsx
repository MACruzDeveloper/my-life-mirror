import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { ScoreCards } from "@modules/assessments/ui/ScoreCards";
import { useLatestScores } from "@modules/assessments/ui/queries";
import { RecommendationDisclaimer, RecommendationNote } from "@modules/recommendations/ui/RecommendationNote";
import { useRecommendations } from "@modules/recommendations/ui/queries";

/**
 * Página de inicio tras el login (RF-39). Primera vez (todavía sin ninguna
 * puntuación): bienvenida con un enlace grande a la entrevista, que es el
 * primer paso. Después: directo al panel, que por ahora son las tarjetas de
 * resultados — RF-14 (gráficos) las sustituirá aquí.
 */
export function Home() {
  const { t } = useTranslation();
  const { data: resultados, isPending, isError } = useLatestScores();
  const recomendaciones = useRecommendations().data ?? [];

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const primeraVez = resultados !== undefined && !resultados.some((r) => r.score !== undefined);

  if (isError || primeraVez) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", mt: { xs: 4, sm: 8 }, textAlign: "center", px: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("panel.bienvenidaTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {t("panel.bienvenidaTexto")}
        </Typography>
        {isError && (
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
      <ScoreCards
        resultados={resultados ?? []}
        extraFor={(id) => {
          const r = recomendaciones.find((x) => x.categoryId === id);
          return r ? <RecommendationNote templateKey={r.templateKey} categoryName={r.categoryName} /> : null;
        }}
      />
      {recomendaciones.length > 0 && <RecommendationDisclaimer />}
    </Box>
  );
}
