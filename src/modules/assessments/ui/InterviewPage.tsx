import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import interviewerAvatar from "../../../assets/avatars/interviewer.svg";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { CATEGORIES_KEY, useCategories, type CategoryDto } from "@modules/categories/ui/queries";
import { useAiIdeasActive } from "@modules/accounts/ui/queries";
import { RECOMMENDATIONS_KEY, useRecommendations, type RecommendationDto } from "@modules/recommendations/ui/queries";
import { Bubble } from "./interview/Bubble";
import { PENDING_COLORS } from "./interview/pendingColors";
import { CategoryQuestion, type CategorySaveStatus, type LastExperience, type LastUpdate } from "./interview/CategoryQuestion";
import { InterviewProgress, type ProgressStatus } from "./interview/InterviewProgress";
import { SavedIdeaDialog } from "./interview/SavedIdeaDialog";
import { ASSESSMENTS_KEY, LATEST_SCORES_KEY, useAssessmentHistory, useLatestScores } from "./queries";
import type { LatestScoreDto } from "./ScoreCards";

/** Lleva a la pregunta de una categoría; sin animación si el usuario prefiere menos movimiento. */
function scrollToQuestion(categoryId: string) {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  document.getElementById(`pregunta-${categoryId}`)?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _omitted, ...rest } = record;
  void _omitted;
  return rest;
}

const isOpenRecommendation = (recommendation: RecommendationDto) => recommendation.status === "pending" || recommendation.status === "postponed";

const categoryRequest = (categoryId: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ categoryId }),
});

/**
 * Vista de RF-10 — la "entrevista personal", siempre editable. Mobile-first
 * (ADR-07 apartado 6). Diseño relajado a propósito (paleta suave, esquinas
 * redondeadas, mucho aire, tono de conversación); los avatares son imágenes
 * por defecto — el catálogo real llega con RF-26.
 *
 * No hay "entrevistas nuevas": la pantalla muestra el estado actual (categorías
 * marcadas = activas, con su última puntuación precargada) y el usuario lo
 * cambia cuando quiera. Cambiar una puntuación **inserta** una evaluación
 * nueva — nunca se sobrescribe una anterior (RF-12, y el histórico servirá a
 * RF-14). Marcar/desmarcar una categoría la activa/desactiva (RF-07, con
 * consentimiento para las sensibles, RF-04). Puntuar es opcional por
 * categoría. Diez botones en vez de un slider: un slider siempre tiene un
 * valor por defecto (un 5 preseleccionado sesgaría los datos).
 * UX-05: cada categoría se guarda con su propio botón; si el guardado abre una
 * idea nueva, se enseña en una ventana. Cada pregunta es un `CategoryQuestion`.
 * Ver docs/user-stories/RF-10-entrevista.md y UX-05-respuesta-inmediata-entrevista.md.
 */
export function InterviewPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { categoryLabel, isPending: labelsPending } = useCategoryLabel();
  const categoriesQuery = useCategories();
  const latestScoresQuery = useLatestScores();
  const categories = categoriesQuery.data ?? [];
  // Solo lo que el usuario ha cambiado en esta pantalla; el resto sale de la última puntuación guardada.
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [categoryAwaitingConsent, setCategoryAwaitingConsent] = useState<CategoryDto | null>(null);
  const [isSendingConsent, setIsSendingConsent] = useState(false);
  // Categorías con una petición en curso: evita dobles clics contradictorios y enseña un indicador en las sensibles.
  const [pendingCategoryIds, setPendingCategoryIds] = useState<Set<string>>(new Set());
  // Errores de activar/desactivar categorías o de "¿Qué te ayuda?"; los del guardado salen en su categoría.
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, CategorySaveStatus>>({});
  // UX-05: la idea nueva que ha abierto el último guardado (abre "Cambios guardados").
  const [newIdea, setNewIdea] = useState<RecommendationDto | null>(null);
  const historyQuery = useAssessmentHistory();
  const recommendations = useRecommendations().data ?? [];
  // Categorías con experiencia escrita sin guardar (para el progreso); el texto vive en cada pregunta.
  const [notedCategoryIds, setNotedCategoryIds] = useState<ReadonlySet<string>>(new Set());
  const personalizeIdeas = useAiIdeasActive();

  const savedScores: Record<string, number> = {};
  for (const latestScore of latestScoresQuery.data ?? []) if (latestScore.score !== undefined) savedScores[latestScore.categoryId] = latestScore.score;
  const scores: Record<string, number> = { ...savedScores, ...draftScores };
  const hasSavedAnswers = Object.keys(savedScores).length > 0;

  const activeCategories = categories.filter((category) => category.status === "active");
  const regularCategories = categories.filter((category) => !category.isSensitiveData);
  const sensitiveCategories = categories.filter((category) => category.isSensitiveData);
  const allRegularActive = regularCategories.length > 0 && regularCategories.every((category) => category.status === "active");
  const anyRegularActive = regularCategories.some((category) => category.status === "active");

  // El historial llega del más reciente al más antiguo: lo primero que se encuentra de cada categoría es lo último.
  const lastUpdateByCategory = new Map<string, LastUpdate>();
  const lastExperienceByCategory = new Map<string, LastExperience>();
  for (const session of historyQuery.data ?? []) {
    for (const entry of session.entries) {
      if (!lastUpdateByCategory.has(entry.categoryId)) lastUpdateByCategory.set(entry.categoryId, { recordedAt: session.recordedAt, score: entry.score, previousScore: entry.previousScore });
      if (entry.note && !lastExperienceByCategory.has(entry.categoryId)) lastExperienceByCategory.set(entry.categoryId, { note: entry.note, recordedAt: session.recordedAt });
    }
  }

  const handleNoteStateChange = useCallback((categoryId: string, hasNote: boolean) => {
    setNotedCategoryIds((current) => {
      const next = new Set(current);
      if (hasNote) next.add(categoryId);
      else next.delete(categoryId);
      return next;
    });
  }, []);

  const today = new Date().toDateString();
  function progressStatus(categoryId: string): ProgressStatus {
    if (scores[categoryId] === undefined) return { kind: "unanswered" };
    if (scores[categoryId] !== savedScores[categoryId] || notedCategoryIds.has(categoryId)) return { kind: "unsaved" };
    const lastUpdate = lastUpdateByCategory.get(categoryId);
    if (saveStatuses[categoryId]?.kind === "saved" || (lastUpdate && new Date(lastUpdate.recordedAt).toDateString() === today)) return { kind: "savedToday" };
    return lastUpdate ? { kind: "saved", recordedAt: lastUpdate.recordedAt } : { kind: "savedToday" };
  }

  function setSaveStatus(categoryId: string, status: CategorySaveStatus) {
    setSaveStatuses((current) => ({ ...current, [categoryId]: status }));
  }

  function setCategoryStatus(id: string, status: "active" | "inactive") {
    queryClient.setQueryData<CategoryDto[]>(CATEGORIES_KEY, (current) => current?.map((category) => (category.id === id ? { ...category, status } : category)));
  }

  function setCategoryExperienceTags(id: string, experienceTags: string[]) {
    queryClient.setQueryData<CategoryDto[]>(CATEGORIES_KEY, (current) => current?.map((category) => (category.id === id ? { ...category, experienceTags } : category)));
  }

  /**
   * RF-41: marcar o desmarcar "qué te ayuda" se guarda al momento, como marcar
   * una categoría (optimista, se deshace si el servidor falla); no espera al
   * "Guardar" de la categoría, que es para la puntuación y la experiencia.
   */
  async function toggleExperienceTag(category: CategoryDto, tag: string) {
    const previous = category.experienceTags ?? [];
    const next = previous.includes(tag) ? previous.filter((current) => current !== tag) : [...previous, tag];
    setCategoryExperienceTags(category.id, next);
    try {
      const response = await fetch("/api/categories/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id, tags: next }),
      });
      if (!response.ok) throw new Error("rejected");
    } catch {
      setCategoryExperienceTags(category.id, previous);
      setPageError(t("entrevista.errorExperiencia"));
    }
  }

  function markPending(id: string, isPending: boolean) {
    setPendingCategoryIds((current) => {
      const next = new Set(current);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /** Activar/desactivar cambia qué categorías cuentan en resultados: se pide de nuevo en segundo plano. */
  function refreshResults() {
    void queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
  }

  /**
   * Elegir una categoría que aún no se sigue la activa (RF-07). Las no
   * sensibles se marcan al instante y se deshacen si el servidor falla (la
   * API tarda cientos de ms; esperar para pintar un clic parece que no
   * funciona). Las sensibles no pueden ser optimistas — el servidor puede
   * pedir consentimiento (RF-04) — y muestran un indicador mientras tanto.
   */
  async function activateCategory(category: CategoryDto) {
    if (pendingCategoryIds.has(category.id)) return;
    markPending(category.id, true);
    const isOptimistic = !category.isSensitiveData;
    if (isOptimistic) setCategoryStatus(category.id, "active");

    try {
      const response = await fetch("/api/categories/activate", categoryRequest(category.id));
      const data = await response.json();

      if (!response.ok) {
        if (isOptimistic) setCategoryStatus(category.id, "inactive");
        if (data.code === "CONSENT_REQUIRED") {
          setCategoryAwaitingConsent(category);
        } else {
          setPageError(data.error ?? t("entrevista.errorActivar"));
        }
        return false;
      }

      setCategoryStatus(category.id, "active");
      refreshResults();
      return true;
    } catch {
      if (isOptimistic) setCategoryStatus(category.id, "inactive");
      setPageError(t("comun.errorServidor"));
      return false;
    } finally {
      markPending(category.id, false);
    }
  }

  async function deactivateCategory(category: CategoryDto) {
    if (pendingCategoryIds.has(category.id)) return;
    markPending(category.id, true);
    setCategoryStatus(category.id, "inactive");
    // Lo que estaba a medias de esa categoría se descarta; las evaluaciones ya guardadas se conservan.
    setDraftScores((current) => omitKey(current, category.id));
    handleNoteStateChange(category.id, false);

    try {
      const response = await fetch("/api/categories/deactivate", categoryRequest(category.id));
      if (!response.ok) {
        const data = await response.json();
        setCategoryStatus(category.id, "active");
        setPageError(data.error ?? t("entrevista.errorActivar"));
        return;
      }
      refreshResults();
    } catch {
      setCategoryStatus(category.id, "active");
      setPageError(t("comun.errorServidor"));
    } finally {
      markPending(category.id, false);
    }
  }

  function toggleCategory(category: CategoryDto) {
    if (category.status === "active") void deactivateCategory(category);
    else void activateCategory(category);
  }

  async function confirmConsent() {
    if (!categoryAwaitingConsent) return;
    const category = categoryAwaitingConsent;
    setIsSendingConsent(true);

    try {
      const response = await fetch("/api/consent/grant", categoryRequest(category.id));
      if (!response.ok) {
        const data = await response.json();
        setPageError(data.error ?? t("entrevista.errorActivar"));
        return;
      }
      await activateCategory(category);
    } finally {
      setIsSendingConsent(false);
      setCategoryAwaitingConsent(null);
    }
  }

  /**
   * "Seleccionar todas" actúa solo sobre la columna sin consentimiento: las
   * sensibles se marcan una a una (el consentimiento, RF-04, es por
   * categoría). Con todas marcadas, desmarcar las desactiva.
   */
  async function toggleAllRegular() {
    if (allRegularActive) {
      await Promise.all(regularCategories.map(deactivateCategory));
      return;
    }
    await Promise.all(regularCategories.filter((category) => category.status === "inactive").map(activateCategory));
  }

  /**
   * UX-05: guarda una sola categoría (el mismo POST, con una entrada). Después
   * espera a que se refresquen las recomendaciones: si el guardado ha abierto
   * una idea que no estaba, la enseña en "Cambios guardados"; si no, la
   * categoría dice "Guardado ahora".
   */
  async function saveCategory(categoryId: string, note: string | undefined): Promise<boolean> {
    const score = scores[categoryId];
    setSaveStatus(categoryId, { kind: "saving" });
    const openBefore = new Set((queryClient.getQueryData<RecommendationDto[]>(RECOMMENDATIONS_KEY) ?? []).filter(isOpenRecommendation).map((recommendation) => recommendation.id));

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ categoryId, score, ...(note ? { note } : {}) }] }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveStatus(categoryId, { kind: "error", message: data.error ?? t("entrevista.errorGenerico") });
        return false;
      }

      // La caché se actualiza al momento con lo guardado (Resultados/Inicio ya lo ven) y se confirma en segundo plano.
      queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (current) => current?.map((latestScore) => (latestScore.categoryId === categoryId ? { ...latestScore, score } : latestScore)));
      setDraftScores((current) => omitKey(current, categoryId));
      setSaveStatus(categoryId, { kind: "saved" });

      await queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
      const idea = (queryClient.getQueryData<RecommendationDto[]>(RECOMMENDATIONS_KEY) ?? []).find(
        (recommendation) => recommendation.categoryId === categoryId && isOpenRecommendation(recommendation) && !openBefore.has(recommendation.id),
      );
      if (idea) setNewIdea(idea);
      return true;
    } catch {
      setSaveStatus(categoryId, { kind: "error", message: t("comun.errorServidor") });
      return false;
    }
  }

  const renderCategoryRow = (category: CategoryDto) => (
    <Box key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <FormControlLabel
      control={<Checkbox checked={category.status === "active"} onChange={() => toggleCategory(category)} />}
      label={
        <Box>
          <Typography variant="body1" component="span">
            {categoryLabel(category.catalogId).name}
          </Typography>
          {categoryLabel(category.catalogId).description && (
            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
              {categoryLabel(category.catalogId).description}
            </Typography>
          )}
        </Box>
      }
    />
  {pendingCategoryIds.has(category.id) && category.isSensitiveData && (
      <CircularProgress size={16} aria-label={categoryLabel(category.catalogId).name} />
    )}
    </Box>
  );

  if (categoriesQuery.isPending || latestScoresQuery.isPending || labelsPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 280px" }, alignItems: "start", mt: { xs: 1, sm: 3 } }}>
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 4,
        bgcolor: "#F5F7F6",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* La entrevista es la primera vez; con respuestas guardadas, la misma pantalla se presenta como "actualizarlas". */}
      <Typography variant="h5" component="h1">
        {hasSavedAnswers ? t("entrevista.tituloActualizar") : t("entrevista.titulo")}
      </Typography>

      <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
        <Typography variant="body1">{hasSavedAnswers ? t("entrevista.descripcionActualizar") : t("entrevista.descripcion")}</Typography>
        {/* UX-01: la primera vez, los pasos concretos de esta pantalla; al actualizar ya se conocen. */}
        {!hasSavedAnswers && (
          <Box component="ol" aria-label={t("entrevista.pasosTitulo")} sx={{ my: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {(t("entrevista.pasosPrimeraVez", { returnObjects: true, boton: t("entrevista.guardar") }) as string[]).map((step) => (
              <Typography component="li" variant="body2" key={step}>
                {step}
              </Typography>
            ))}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.escala")}
        </Typography>
      </Bubble>

      {(categoriesQuery.isError || latestScoresQuery.isError) && <Alert severity="error">{t("entrevista.errorCarga")}</Alert>}
      {pageError && <Alert severity="error">{pageError}</Alert>}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, alignItems: "start" }}>
        <Box role="group" aria-labelledby="columna-libres" sx={{ bgcolor: "#FFFFFF", borderRadius: 3, border: "1px solid #E4EAE8", p: 2 }}>
          <Typography id="columna-libres" variant="subtitle1" sx={{ mb: 1 }}>
            {t("entrevista.elegirTitulo")}
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={allRegularActive} indeterminate={anyRegularActive && !allRegularActive} onChange={() => void toggleAllRegular()} />}
            label={t("entrevista.seleccionarTodas")}
          />
          <Box sx={{ display: "flex", flexDirection: "column", pl: 3 }}>{regularCategories.map(renderCategoryRow)}</Box>
        </Box>
        <Box role="group" aria-labelledby="columna-sensibles" sx={{ bgcolor: "#FBF8FF", borderRadius: 3, border: "1px solid #E2DAF3", p: 2 }}>
          <Typography id="columna-sensibles" variant="subtitle1" sx={{ mb: 0.5 }}>
            {t("entrevista.sensiblesTitulo")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {t("entrevista.sensiblesExplicacion")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>{sensitiveCategories.map(renderCategoryRow)}</Box>
        </Box>
      </Box>

      {activeCategories.length > 0 && (
        // En escritorio, el panel de progreso de la derecha hace de accesos directos.
        <Box component="nav" aria-label={t("entrevista.irA")} sx={{ display: { xs: "flex", lg: "none" }, flexWrap: "wrap", gap: 1 }}>
          {activeCategories.map((category) => {
            const isUnanswered = scores[category.id] === undefined;
            return (
              <Box
                key={category.id}
                component="a"
                href={`#pregunta-${category.id}`}
                onClick={(event: React.MouseEvent) => {
                  event.preventDefault();
                  scrollToQuestion(category.id);
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: isUnanswered ? PENDING_COLORS.border : "#DDE3E1",
                  bgcolor: isUnanswered ? PENDING_COLORS.bg : "#FFFFFF",
                  color: isUnanswered ? PENDING_COLORS.fg : "text.primary",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  "&:hover, &:focus-visible": { borderColor: isUnanswered ? PENDING_COLORS.fg : "text.secondary" },
                }}
              >
                {categoryLabel(category.catalogId).name}
                {isUnanswered && (
                  <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    · {t("entrevista.sinResponder")}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {activeCategories.map((category) => (
        <CategoryQuestion
          key={category.id}
          category={category}
          label={categoryLabel(category.catalogId)}
          score={scores[category.id]}
          scoreChanged={scores[category.id] !== savedScores[category.id]}
          lastUpdate={lastUpdateByCategory.get(category.id)}
          lastExperience={lastExperienceByCategory.get(category.id)}
          saveStatus={saveStatuses[category.id]}
          recommendation={recommendations.find((recommendation) => recommendation.categoryId === category.id && isOpenRecommendation(recommendation))}
          personalizeIdeas={personalizeIdeas}
          onNoteStateChange={handleNoteStateChange}
          onScore={(categoryId, score) => setDraftScores((current) => ({ ...current, [categoryId]: score }))}
          onToggleTag={(target, tag) => void toggleExperienceTag(target, tag)}
          onSave={saveCategory}
        />
      ))}

      {activeCategories.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.elegirAlgo")}
        </Typography>
      )}

      <SavedIdeaDialog recommendation={newIdea} categoryName={newIdea ? categoryLabel(newIdea.catalogId).name : ""} personalize={personalizeIdeas} onClose={() => setNewIdea(null)} />

      <Dialog open={categoryAwaitingConsent !== null} onClose={() => setCategoryAwaitingConsent(null)}>
        <DialogTitle>{t("categorias.modalTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("categorias.modalTexto", { categoria: categoryAwaitingConsent ? categoryLabel(categoryAwaitingConsent.catalogId).name : "" })}</DialogContentText>
          <Link href="/politica-privacidad" target="_blank" rel="noopener noreferrer">
            {t("categorias.leerPolitica")}
          </Link>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryAwaitingConsent(null)}>{t("categorias.modalCancelar")}</Button>
          <Button onClick={confirmConsent} variant="contained" disabled={isSendingConsent}>
            {t("categorias.modalAceptar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    {activeCategories.length > 0 && (
      <Box sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 16 }}>
        <InterviewProgress
          items={activeCategories.map((category) => ({ categoryId: category.id, name: categoryLabel(category.catalogId).name, status: progressStatus(category.id) }))}
          onSelect={scrollToQuestion}
        />
      </Box>
    )}
    </Box>
  );
}
