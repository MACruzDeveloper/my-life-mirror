import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useAssessmentHistory, type HistorySessionDto } from "./queries";

/** Días que se ven al abrir el historial; "Ver más" enseña el resto (UX-04). */
const INITIAL_VISIBLE = 5;

interface DayChange {
  categoryId: string;
  catalogId?: string;
  score: number;
  previousScore?: number;
  /** Experiencias de ese día, de la más reciente a la más antigua. */
  notes: string[];
}

interface Day {
  recordedAt: string;
  changes: DayChange[];
}

/**
 * Junta los guardados de un mismo día (UX-05: ahora se guarda categoría a
 * categoría). Por categoría, el cambio del día: de la puntuación anterior al
 * primer guardado a la última. Recibe los guardados del más reciente al más antiguo.
 */
function groupByDay(sessions: HistorySessionDto[], dayKey: (isoDate: string) => string): Day[] {
  const days: Day[] = [];
  for (const session of sessions) {
    let day = days.at(-1);
    if (!day || dayKey(day.recordedAt) !== dayKey(session.recordedAt)) {
      day = { recordedAt: session.recordedAt, changes: [] };
      days.push(day);
    }
    for (const entry of session.entries) {
      const change = day.changes.find((candidate) => candidate.categoryId === entry.categoryId);
      if (!change) {
        day.changes.push({ categoryId: entry.categoryId, catalogId: entry.catalogId, score: entry.score, previousScore: entry.previousScore, notes: entry.note ? [entry.note] : [] });
        continue;
      }
      // Un guardado más antiguo del mismo día: su "antes" es el "antes" del día; si
      // no lo tiene (la primera vez que se puntuó), el día empieza en su puntuación.
      change.previousScore = entry.previousScore ?? entry.score;
      if (entry.note) change.notes.push(entry.note);
    }
  }
  return days;
}

/**
 * Registro de cambios del usuario: qué guardó y cuándo, con "antes → ahora"
 * cuando cambió una puntuación. No es la evolución gráfica (RF-16): solo una
 * lista. UX-04: empieza plegado; al abrirlo, línea de tiempo por meses. UX-05:
 * vive en Resultados (en la entrevista quedan la última actualización de cada
 * categoría) y agrupa por día. Misma caché que la entrevista: se refresca
 * cuando esta invalida `assessments` tras guardar.
 */
export function HistoryTimeline() {
  const { t, i18n } = useTranslation();
  const { data: sessions } = useAssessmentHistory();
  const { categoryLabel } = useCategoryLabel();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const titleId = useId();
  const listId = useId();

  const monthOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  const dayOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long" });
  const allDays = groupByDay(sessions ?? [], (isoDate) => new Date(isoDate).toDateString());
  const visibleDays = showAll ? allDays : allDays.slice(0, INITIAL_VISIBLE);

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ bgcolor: "#FFFFFF", border: "1px solid #E4EAE8", borderRadius: 3, p: 2 }}>
      <Typography id={titleId} variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        {t("entrevista.historialTitulo")}
      </Typography>
      {sessions && sessions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("entrevista.historialVacio")}
        </Typography>
      )}
      {allDays.length > 0 && (
        <Button size="small" variant="text" aria-expanded={isOpen} aria-controls={listId} onClick={() => setIsOpen((open) => !open)} sx={{ px: 0 }}>
          {isOpen ? t("entrevista.ocultarHistorial") : t("entrevista.verHistorial", { count: allDays.length })}
        </Button>
      )}
      {isOpen && (
        <>
          <Box component="ol" id={listId} aria-labelledby={titleId} sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {visibleDays.map((day, index) => {
              const startsMonth = index === 0 || monthOf(visibleDays[index - 1].recordedAt) !== monthOf(day.recordedAt);
              return (
                <Box component="li" key={day.recordedAt} sx={{ borderLeft: "2px solid #E4EAE8", pl: 1.5 }}>
                  {startsMonth && (
                    <Typography variant="overline" component="h3" sx={{ display: "block", lineHeight: 1.6, color: "text.secondary", ml: -1.75, mb: 0.5 }}>
                      {monthOf(day.recordedAt)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {dayOf(day.recordedAt)}
                  </Typography>
                  {day.changes.map((change) => (
                    <Box key={change.categoryId}>
                      <Typography variant="body2">
                        {categoryLabel(change.catalogId).name}: {change.previousScore !== undefined ? `${change.previousScore} → ${change.score}` : change.score}
                      </Typography>
                      {/* UX-05: las experiencias de ese día (privadas: solo las ve el usuario). */}
                      {change.notes.map((note, noteIndex) => (
                        <Typography key={noteIndex} variant="caption" color="text.secondary" component="p" sx={{ fontStyle: "italic", overflowWrap: "anywhere" }}>
                          «{note}»
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
          {!showAll && allDays.length > INITIAL_VISIBLE && (
            <Button size="small" variant="text" onClick={() => setShowAll(true)} sx={{ px: 0, mt: 1 }}>
              {t("entrevista.verMasHistorial")}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
