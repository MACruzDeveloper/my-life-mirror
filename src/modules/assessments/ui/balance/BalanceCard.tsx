import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { ChartDataTable } from "@shared/ui/charts/ChartDataTable";
import { escapeHtml } from "@shared/ui/charts/escapeHtml";
import { RadarChart } from "@shared/ui/charts/RadarChart/RadarChart";
import type { LatestScoreDto } from "../queries";
import { buildBalance } from "./balance";

/**
 * Escala 0-10 en todos los ejes: empieza en 0 (no en 1) para que una
 * puntuación de 1 no quede pegada al centro, invisible.
 */
const SCORE_SCALE = { min: 0, max: 10, splitNumber: 5 };

/**
 * "Tu equilibrio" (RF-15): radar con la última puntuación de cada categoría
 * activa y puntuada, en el orden del catálogo, con descripción textual y tabla
 * "Ver datos". Un solo relleno suave, sin marcar "lo peor" (RN-04).
 * Ver docs/user-stories/RF-15-radar-equilibrio.md.
 */
export function BalanceCard({ latestScores }: { latestScores: LatestScoreDto[] }) {
  const { t } = useTranslation();
  // `latestScores` llega con el nombre ya en el idioma de la interfaz (lo resuelve la página).
  const balance = useMemo(() => buildBalance(latestScores), [latestScores]);
  const scoreList = balance.axes.map((axis) => `${axis.name} ${axis.value}`).join(", ");

  return (
    <Box
      component="section"
      aria-labelledby="balance-title"
      sx={{ p: 2, borderRadius: 0, border: 1, borderColor: "divider", bgcolor: "background.paper", display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Typography id="balance-title" variant="h6" component="h2">
        {t("equilibrio.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("equilibrio.descripcion")}
      </Typography>

      {balance.hasEnoughData ? (
        <>
          <Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
            <RadarChart
              axes={balance.axes}
              scale={SCORE_SCALE}
              ariaLabel={t("equilibrio.resumen", { lista: scoreList })}
              formatTooltip={(axes) => axes.map((axis) => `${escapeHtml(axis.name)}: <strong>${axis.value}</strong>`).join("<br/>")}
            />
          </Box>
          <ChartDataTable
            caption={t("equilibrio.tabla")}
            headers={[t("equilibrio.categoria"), t("evolucion.puntuacion")]}
            rows={balance.axes.map((axis) => ({ key: axis.name, cells: [axis.name, axis.value] }))}
            showLabel={t("evolucion.verDatos")}
            hideLabel={t("evolucion.ocultarDatos")}
          />
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("equilibrio.pocasCategorias")}
        </Typography>
      )}

      {balance.unscoredNames.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("equilibrio.faltan", { lista: balance.unscoredNames.join(", ") })}
        </Typography>
      )}
    </Box>
  );
}
