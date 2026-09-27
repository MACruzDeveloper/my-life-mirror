import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { formatMonthYear, type Period, type TimeWindow } from "@shared/ui/charts/timeWindow";

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
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ minWidth: 150, textAlign: "center" }}>
          {`${formatMonthYear(window.start, i18n.language)} – ${formatMonthYear(lastMonthShown, i18n.language)}`}
        </Typography>
        <IconButton size="small" aria-label={t("evolucion.siguiente")} disabled={!window.canGoForward} onClick={onNext}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
