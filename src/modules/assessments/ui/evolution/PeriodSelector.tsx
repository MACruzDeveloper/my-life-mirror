import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { formatMonthYear, type Period, type TimeWindow } from "@shared/ui/charts/timeWindow";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <SvgIcon fontSize="small">
      <path d={direction === "left" ? "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" : "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"} />
    </SvgIcon>
  );
}

interface PeriodSelectorProps {
  period: Period;
  window: TimeWindow;
  onPeriodChange: (period: Period) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Selector del periodo que muestran TODOS los gráficos del panel a la vez:
 * 6 meses / 12 meses / todo, con flechas para ir a periodos anteriores. En
 * móvil los botones ocupan el ancho completo.
 */
export function PeriodSelector({ period, window, onPeriodChange, onPrevious, onNext }: PeriodSelectorProps) {
  const { t, i18n } = useTranslation();
  const lastMonthShown = new Date(window.end.getFullYear(), window.end.getMonth() - 1, 1);

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={period}
        aria-label={t("evolucion.periodo")}
        onChange={(_event, value: Period | null) => value && onPeriodChange(value)}
        sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" }, "& .MuiToggleButton-root": { flex: { xs: 1, sm: "0 0 auto" }, textTransform: "none", px: 1.5 } }}
      >
        <ToggleButton value="6m">{t("evolucion.periodo6")}</ToggleButton>
        <ToggleButton value="12m">{t("evolucion.periodo12")}</ToggleButton>
        <ToggleButton value="all">{t("evolucion.periodoTodo")}</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: { sm: "auto" } }}>
        <IconButton size="small" aria-label={t("evolucion.anterior")} disabled={!window.canGoBack} onClick={onPrevious}>
          <ChevronIcon direction="left" />
        </IconButton>
        <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ minWidth: 150, textAlign: "center" }}>
          {`${formatMonthYear(window.start, i18n.language)} – ${formatMonthYear(lastMonthShown, i18n.language)}`}
        </Typography>
        <IconButton size="small" aria-label={t("evolucion.siguiente")} disabled={!window.canGoForward} onClick={onNext}>
          <ChevronIcon direction="right" />
        </IconButton>
      </Box>
    </Box>
  );
}
