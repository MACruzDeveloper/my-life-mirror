import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { useAssessmentHistory } from "./queries";

/** Guardados que se ven al abrir el historial; "Ver más" enseña el resto (UX-04). */
const INITIAL_VISIBLE = 5;

/**
 * Registro de cambios del usuario junto a la entrevista: qué guardó y cuándo,
 * con "antes → ahora" cuando cambió una puntuación. No es la evolución gráfica
 * (RF-16): solo una lista. UX-04: empieza plegado para no ocupar la entrevista;
 * al abrirlo, línea de tiempo por meses. Mismos datos y caché que antes (abrir
 * no repite la llamada); se refresca cuando la entrevista invalida la caché de
 * `assessments` tras guardar.
 */
export function InterviewHistory() {
  const { t, i18n } = useTranslation();
  const { data: sessions } = useAssessmentHistory();
  const { categoryLabel } = useCategoryLabel();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const titleId = useId();
  const listId = useId();

  const monthOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
  const dayOf = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long" });
  const allSessions = sessions ?? [];
  const visibleSessions = showAll ? allSessions : allSessions.slice(0, INITIAL_VISIBLE);

  return (
    <Box component="aside" aria-labelledby={titleId} sx={{ bgcolor: "#FFFFFF", border: "1px solid #E4EAE8", borderRadius: 3, p: 2 }}>
      <Typography id={titleId} variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        {t("entrevista.historialTitulo")}
      </Typography>
      {sessions && sessions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t("entrevista.historialVacio")}
        </Typography>
      )}
      {allSessions.length > 0 && (
        <Button size="small" variant="text" aria-expanded={isOpen} aria-controls={listId} onClick={() => setIsOpen((open) => !open)} sx={{ px: 0 }}>
          {isOpen ? t("entrevista.ocultarHistorial") : t("entrevista.verHistorial", { count: allSessions.length })}
        </Button>
      )}
      {isOpen && (
        <>
          <Box component="ol" id={listId} aria-labelledby={titleId} sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {visibleSessions.map((session, index) => {
              const startsMonth = index === 0 || monthOf(visibleSessions[index - 1].recordedAt) !== monthOf(session.recordedAt);
              return (
                <Box component="li" key={session.recordedAt} sx={{ borderLeft: "2px solid #E4EAE8", pl: 1.5 }}>
                  {startsMonth && (
                    <Typography variant="overline" component="h3" sx={{ display: "block", lineHeight: 1.6, color: "text.secondary", ml: -1.75, mb: 0.5 }}>
                      {monthOf(session.recordedAt)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {dayOf(session.recordedAt)}
                  </Typography>
                  {session.entries.map((entry) => (
                    <Typography key={entry.categoryId} variant="body2">
                      {categoryLabel(entry.catalogId).name}: {entry.previousScore !== undefined ? `${entry.previousScore} → ${entry.score}` : entry.score}
                    </Typography>
                  ))}
                </Box>
              );
            })}
          </Box>
          {!showAll && allSessions.length > INITIAL_VISIBLE && (
            <Button size="small" variant="text" onClick={() => setShowAll(true)} sx={{ px: 0, mt: 1 }}>
              {t("entrevista.verMasHistorial")}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
