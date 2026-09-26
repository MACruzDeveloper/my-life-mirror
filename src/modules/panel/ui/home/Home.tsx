import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useLatestScores } from "@modules/assessments/ui/queries";
import { Dashboard } from "./Dashboard";
import { FirstTimeWelcome } from "./FirstTimeWelcome";
import { LoadErrorState } from "./LoadErrorState";

/**
 * Página de inicio tras el login (RF-39). Solo decide qué mostrar; cada
 * estado es su propio componente:
 * - cargando → indicador;
 * - error al cargar → `LoadErrorState` (con reintento; no es lo mismo que "primera vez");
 * - sin ninguna puntuación → `FirstTimeWelcome`, que invita a la entrevista;
 * - si no → `Dashboard`, el panel (RF-14 + RF-16).
 * Ver docs/user-stories/RF-14-panel-general.md y RF-16-evolucion-temporal.md.
 */
export function Home() {
  const { data: latestScores, isPending, isError, refetch } = useLatestScores();

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <LoadErrorState onRetry={() => void refetch()} />;
  }

  const firstTimeUser = !latestScores.some((latestScore) => latestScore.score !== undefined);
  if (firstTimeUser) {
    return <FirstTimeWelcome />;
  }

  return <Dashboard latestScores={latestScores} />;
}
