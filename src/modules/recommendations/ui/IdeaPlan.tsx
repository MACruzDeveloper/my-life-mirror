import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { useTranslation } from "react-i18next";
import { dayFromToday, formatDay } from "./planDates";

interface IdeaPlanProps {
  /** El día que tiene ahora ("AAAA-MM-DD"), si tiene. */
  plannedFor?: string;
  /** Un día nuevo, o `null` para dejarla sin fecha. */
  onChange: (plannedFor: string | null) => void;
  /** Recién guardada: la pregunta sale ya abierta. */
  defaultOpen?: boolean;
}

/**
 * RF-47: la fecha orientativa de una idea guardada. Enseña la que tiene ("Para
 * el 20 de octubre") y, al abrirla, pregunta "¿Cuándo te apetece probarla?" con
 * dos atajos, una fecha a elegir y "Sin fecha". Es una propuesta de la propia
 * persona, no un plazo: una fecha pasada se enseña igual, sin color de aviso.
 */
export function IdeaPlan({ plannedFor, onChange, defaultOpen = false }: IdeaPlanProps) {
  const { t, i18n } = useTranslation();
  const questionId = useId();
  const [open, setOpen] = useState(defaultOpen);

  function choose(value: string | null) {
    setOpen(false);
    onChange(value);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1 }}>
        {plannedFor && (
          <Typography variant="body2" data-planned-for={plannedFor} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <EventOutlinedIcon fontSize="inherit" />
            {t("planIdea.paraEl", { fecha: formatDay(plannedFor, i18n.language) })}
          </Typography>
        )}
        {!open && (
          <Button size="small" onClick={() => setOpen(true)} sx={{ textTransform: "none" }}>
            {t(plannedFor ? "planIdea.cambiar" : "planIdea.poner")}
          </Button>
        )}
      </Box>
      {open && (
        <Box role="group" aria-labelledby={questionId} sx={{ mt: 0.5 }}>
          <Typography id={questionId} variant="body2" sx={{ mb: 1 }}>
            {t("planIdea.pregunta")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => choose(dayFromToday(7))}>
              {t("planIdea.unaSemana")}
            </Button>
            <Button size="small" variant="outlined" onClick={() => choose(dayFromToday(30))}>
              {t("planIdea.unMes")}
            </Button>
            <TextField
              type="date"
              size="small"
              label={t("planIdea.otraFecha")}
              defaultValue={plannedFor ?? ""}
              onChange={(changeEvent) => changeEvent.target.value && choose(changeEvent.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dayFromToday(0), max: dayFromToday(365) } }}
              sx={{ width: 170 }}
            />
            <Button size="small" onClick={() => choose(null)}>
              {t("planIdea.sinFecha")}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
            {t("planIdea.sinPresion")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
