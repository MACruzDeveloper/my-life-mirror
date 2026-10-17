import { useMemo } from "react";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { BarChart } from "@shared/ui/charts/BarChart/BarChart";
import { ChartDataTable } from "@shared/ui/charts/ChartDataTable";
import { escapeHtml } from "@shared/ui/charts/escapeHtml";
import type { LatestScoreDto } from "./queries";
import { BAND_LABEL_KEYS, scoreBand } from "./scoreBand";

/** Escala 0-10 con guías cada 2 puntos. */
const SCORE_SCALE = { min: 0, max: 10, splitNumber: 5 };

/**
 * UX-13: la última puntuación de cada categoría puntuada como barras horizontales
 * en una misma escala, todas del color de los gráficos (la banda va escrita en
 * el tooltip, la descripción y la tabla: el color no informa de nada). Debajo,
 * las categorías sin puntuar.
 */
export function ScoreBars({ latestScores }: { latestScores: LatestScoreDto[] }) {
  const { t, i18n } = useTranslation();
  const { categoryLabel } = useCategoryLabel();
  const list = new Intl.ListFormat(i18n.language, { type: "conjunction" });

  const scored = useMemo(
    () =>
      latestScores.flatMap((latestScore) => {
        if (latestScore.score === undefined) return [];
        return [
          {
            name: categoryLabel(latestScore.catalogId).name,
            value: latestScore.score,
            band: t(BAND_LABEL_KEYS[scoreBand(latestScore.score)]),
            date: latestScore.recordedAt ? new Date(latestScore.recordedAt).toLocaleDateString(i18n.language) : undefined,
          },
        ];
      }),
    [latestScores, categoryLabel, t, i18n.language],
  );
  const bars = useMemo(() => scored.map(({ name, value }) => ({ name, value })), [scored]);
  const unscored = latestScores.filter((latestScore) => latestScore.score === undefined).map((latestScore) => categoryLabel(latestScore.catalogId).name);
  const describe = (item: (typeof scored)[number]) => t("resultados.puntuacionConBanda", { categoria: item.name, puntuacion: item.value, banda: item.band });

  return (
    <>
      {scored.length > 0 && (
        <>
          <BarChart
            bars={bars}
            scale={SCORE_SCALE}
            ariaLabel={t("resultados.grafico", { lista: scored.map(describe).join(", ") })}
            formatTooltip={(bar) => {
              const item = scored.find((candidate) => candidate.name === bar.name)!;
              const date = item.date ? `<br/>${escapeHtml(t("resultados.ultima", { fecha: item.date }))}` : "";
              return `${escapeHtml(item.name)}: <strong>${item.value}</strong> · ${escapeHtml(item.band)}${date}`;
            }}
          />
          <ChartDataTable
            caption={t("resultados.tabla")}
            headers={[t("equilibrio.categoria"), t("evolucion.puntuacion"), t("resultados.nivel"), t("resultados.fecha")]}
            rows={scored.map((item) => ({ key: item.name, cells: [item.name, item.value, item.band, item.date ?? "—"] }))}
            showLabel={t("evolucion.verDatos")}
            hideLabel={t("evolucion.ocultarDatos")}
          />
        </>
      )}
      {unscored.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("resultados.sinPuntuarLista", { lista: list.format(unscored) })}
        </Typography>
      )}
    </>
  );
}
