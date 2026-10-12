import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useCategories } from "@modules/categories/ui/queries";
import { useAssessmentHistory, useExperiences, type ExperienceDto, type HistorySessionDto } from "./queries";

/** Días que se ven al abrir el historial; "Ver más" enseña el resto (UX-04). */
const INITIAL_VISIBLE = 5;

interface DayChange {
  categoryId: string;
  catalogId?: string;
  /** Sin puntuación: ese día solo se escribieron experiencias (RF-44). */
  score?: number;
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
 * primer guardado a la última. Las experiencias salen del diario (RF-44), en su
 * día; la nota antigua de cada evaluación ya no se enseña (se copió al diario, y
 * saldría dos veces). Recibe los dos listados del más reciente al más antiguo.
 */
function groupByDay(sessions: HistorySessionDto[], experiences: ExperienceDto[], dayKey: (isoDate: string) => string, catalogIdOf: (categoryId: string) => string | undefined): Day[] {
  const days = new Map<string, Day>();
  const dayFor = (isoDate: string) => {
    const key = dayKey(isoDate);
    const existing = days.get(key);
    if (existing) return existing;
    const created: Day = { recordedAt: isoDate, changes: [] };
    days.set(key, created);
    return created;
  };
  const changeFor = (day: Day, categoryId: string) => {
    const existing = day.changes.find((candidate) => candidate.categoryId === categoryId);
    if (existing) return existing;
    const created: DayChange = { categoryId, catalogId: catalogIdOf(categoryId), notes: [] };
    day.changes.push(created);
    return created;
  };

  for (const session of sessions) {
    const day = dayFor(session.recordedAt);
    for (const entry of session.entries) {
      const change = changeFor(day, entry.categoryId);
      if (change.score === undefined) {
        change.score = entry.score;
        change.previousScore = entry.previousScore;
      } else {
        // Un guardado más antiguo del mismo día: su "antes" es el "antes" del día; si
        // no lo tiene (la primera vez que se puntuó), el día empieza en su puntuación.
        change.previousScore = entry.previousScore ?? entry.score;
      }
    }
  }
  for (const experience of experiences) changeFor(dayFor(experience.createdAt), experience.categoryId).notes.push(experience.text);

  return [...days.values()].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
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
  const experiences = useExperiences().data;
  const categories = useCategories().data;
  const { categoryLabel } = useCategoryLabel();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const titleId = useId();
  const listId = useId();

  const monthOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  const dayOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long" });
  // La identidad en el catálogo, para el nombre: de las evaluaciones o, si no hay, de las categorías.
  const catalogIds = new Map<string, string | undefined>();
  for (const category of Array.isArray(categories) ? categories : []) catalogIds.set(category.id, category.catalogId);
  for (const entry of (sessions ?? []).flatMap((session) => session.entries)) if (entry.catalogId) catalogIds.set(entry.categoryId, entry.catalogId);
  const allDays = groupByDay(sessions ?? [], Array.isArray(experiences) ? experiences : [], (isoDate) => new Date(isoDate).toDateString(), (categoryId) => catalogIds.get(categoryId));
  const visibleDays = showAll ? allDays : allDays.slice(0, INITIAL_VISIBLE);

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ bgcolor: "#FFFFFF", border: "1px solid #DCDFE1", borderRadius: 3, p: 2 }}>
      <Typography id={titleId} variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        {t("entrevista.historialTitulo")}
      </Typography>
      {sessions && allDays.length === 0 && (
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
                <Box component="li" key={day.recordedAt} sx={{ borderLeft: "2px solid #DCDFE1", pl: 1.5 }}>
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
                        {categoryLabel(change.catalogId).name}
                        {change.score !== undefined && `: ${change.previousScore !== undefined ? `${change.previousScore} → ${change.score}` : change.score}`}
                      </Typography>
                      {/* RF-44: las experiencias de ese día, del diario (privadas: solo las ve el usuario). */}
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
