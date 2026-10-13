import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { agendaItems } from "@modules/agenda/ui/calendarMonth";
import { useEvents } from "@modules/agenda/ui/queries";
import { useIdeaReactions } from "@modules/recommendations/ui/ideaReactions";
import { dayFromToday, formatDay } from "@modules/recommendations/ui/planDates";

/** Cuántas cosas próximas se enseñan en Inicio; el resto, en el calendario. */
const MAX_UPCOMING = 3;
/** Hasta cuándo se invita a revisar la nota tras un evento. */
const FOLLOW_UP_DAYS = 14;
// Preferencia de este navegador (como la guía de Inicio): las invitaciones que ya se cerraron.
const DISMISSED_KEY = "mlm.eventFollowUpsDismissed";

function readDismissed(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // No es crítico: la invitación volverá a salir en la próxima visita.
  }
}

/**
 * RF-48, en Inicio. Dos cosas:
 * - Desde el día de un evento con categorías (y hasta 14 días después), una
 *   invitación a revisar la nota de esas categorías. La app no sabe cómo fue y no cambia la
 *   puntuación: solo pregunta (RN-04). Se puede cerrar.
 * - "Próximamente": los próximos eventos e ideas con fecha, con enlace al calendario.
 * Sin nada de eso, no se pinta.
 */
export function AgendaSummary({ categoryNames }: { categoryNames: Record<string, string> }) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const events = useEvents().data;
  const reactions = useIdeaReactions().data;
  const [dismissed, setDismissed] = useState(readDismissed);
  const today = dayFromToday(0);
  const eventList = Array.isArray(events) ? events : [];
  const upcoming = agendaItems(eventList, Array.isArray(reactions) ? reactions : [])
    .filter((item) => item.day >= today)
    .slice(0, MAX_UPCOMING);
  // Solo las categorías que siguen existiendo (y activas): de las demás no hay nota que revisar.
  const namesOf = (categoryIds: readonly string[] | undefined) => (categoryIds ?? []).flatMap((categoryId) => categoryNames[categoryId] ?? []);
  const followUps = eventList.filter((event) => namesOf(event.categoryIds).length > 0 && event.day <= today && event.day >= dayFromToday(-FOLLOW_UP_DAYS) && !dismissed.includes(event.id));
  const listFormat = new Intl.ListFormat(i18n.language, { style: "long", type: "conjunction" });
  if (upcoming.length === 0 && followUps.length === 0) return null;

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
  }

  return (
    <>
      {followUps.length > 0 && (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          {followUps.map((event) => (
            <Box component="li" key={event.id} sx={{ position: "relative", display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1.5, rowGap: 1, p: 2, pr: 6, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
              <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
                <Typography variant="subtitle2" component="p" sx={{ overflowWrap: "anywhere" }}>
                  {t("calendario.comoFue", { titulo: event.title })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("calendario.revisaNota", { categoria: listFormat.format(namesOf(event.categoryIds)) })}
                </Typography>
              </Box>
              <Button component={RouterLink} to="/perfil/entrevista" size="small" variant="outlined">
                {t("calendario.revisar")}
              </Button>
              <IconButton size="small" aria-label={t("comun.cerrar")} onClick={() => dismiss(event.id)} sx={{ position: "absolute", top: 8, right: 8 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      {upcoming.length > 0 && (
        <Box component="section" aria-labelledby={titleId} sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EventOutlinedIcon fontSize="small" color="primary" />
            <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
              {t("calendario.proximamente")}
            </Typography>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {upcoming.map((item) => {
              const categoryName = item.kind === "idea" ? (categoryNames[item.idea.categoryId] ?? "") : "";
              return (
                <Box component="li" key={item.kind === "event" ? item.event.id : `${item.idea.categoryId}-${item.idea.templateKey}`} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, columnGap: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: { sm: "0 0 130px" } }}>
                    {formatDay(item.day, i18n.language)}
                  </Typography>
                  <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    {item.kind === "event" ? item.event.title : t(`recomendaciones.plantillas.${item.idea.templateKey}`, { categoria: categoryName })}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Link component={RouterLink} to="/perfil/calendario" variant="body2" sx={{ display: "inline-block", mt: 1.5 }}>
            {t("calendario.verCalendario")}
          </Link>
        </Box>
      )}
    </>
  );
}
