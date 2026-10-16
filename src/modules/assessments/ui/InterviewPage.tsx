import { isBalanced } from "@modules/recommendations/domain/leisureIdeas";
import { PALE_TINT } from "@shared/ui/theme";
import { ScrollToTopButton } from "@shared/ui/components/ScrollToTopButton";
import { prefersReducedMotion } from "@shared/ui/motion";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import Fade from "@mui/material/Fade";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import interviewerAvatar from "../../../assets/avatars/interviewer.svg";
import { useCategoryLabel } from "@modules/categories/ui/categoryLabels";
import { CATEGORIES_KEY, useCategories, type CategoryDto } from "@modules/categories/ui/queries";
import { useAiIdeasActive, useAiSuggestionsActive } from "@modules/accounts/ui/queries";
import { useOptionalSession } from "@shared/ui/context/SessionContext";
import { PERSONALIZED_IDEAS_KEY, RECOMMENDATIONS_KEY, useRecommendations, type RecommendationDto } from "@modules/recommendations/ui/queries";
import { Bubble } from "./interview/Bubble";
import { QuestionsBar } from "./interview/QuestionsBar";
import { WIDE_PAGE_MAX_WIDTH } from "@shared/ui/components/Breadcrumbs";
import { CategoryPicker } from "./interview/CategoryPicker";
import { CategorySelection } from "./interview/CategorySelection";
import { InterviewSteps, type InterviewStep } from "./interview/InterviewSteps";
import { CategoryQuestion, type CategorySaveStatus, type LastUpdate, type TagFeedback } from "./interview/CategoryQuestion";
import { InterviewProgress, type ProgressStatus } from "./interview/InterviewProgress";
import { SavedIdeaDialog } from "./interview/SavedIdeaDialog";
import type { SuggestionsAnswer } from "./interview/ExperienceJournal";
import {
  ASSESSMENTS_KEY,
  EXPERIENCES_KEY,
  HISTORY_KEY,
  LATEST_SCORES_KEY,
  useAssessmentHistory,
  useExperienceSharing,
  useExperiences,
  useLatestScores,
  type ExperienceDto,
} from "./queries";
import { ScoreFeedbackToast, type ScoreFeedbackMessage } from "./interview/ScoreFeedbackToast";
import { scoreFeedback } from "./scoreFeedback";
import type { LatestScoreDto } from "./ScoreCards";

/**
 * Lleva a la pregunta de una categoría y la hace aparecer con un fundido, para
 * que se vea a dónde se ha llegado. Sin animación si se prefiere menos movimiento.
 */
function scrollToQuestion(categoryId: string) {
  const reduced = prefersReducedMotion();
  const question = document.getElementById(`pregunta-${categoryId}`);
  question?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  if (!reduced) question?.animate?.([{ opacity: 0.25 }, { opacity: 1 }], { duration: 700, easing: "ease-out", delay: 250, fill: "backwards" });
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _omitted, ...rest } = record;
  void _omitted;
  return rest;
}

/** Barra de desplazamiento discreta: fina y semitransparente, más visible al pasar el ratón. */
const SOFT_SCROLLBAR = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0, 0, 0, 0.18) transparent",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0, 0, 0, 0.18)", borderRadius: 3 },
  "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "rgba(0, 0, 0, 0.32)" },
} as const;

/** Cada bloque de la columna principal (introducción, preguntas): mismo marco, distinto fondo. */
const MODULE_STYLES = { p: { xs: 2, sm: 4 }, borderRadius: 0, display: "flex", flexDirection: "column", gap: 3 } as const;

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { categoryLabel, isPending: labelsPending } = useCategoryLabel();
  const isDesktop = useMediaQuery(useTheme().breakpoints.up("lg"), { noSsr: true });
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
  // Categorías añadidas en esta visita, la más reciente primero (sus preguntas van arriba, con animación).
  const [justAddedIds, setJustAddedIds] = useState<string[]>([]);
  // RF-41/RF-42: la reacción al marcar una opción (se borra sola) y cuántas veces han cambiado las ideas de cada categoría.
  const [tagFeedback, setTagFeedback] = useState<Record<string, { kind: TagFeedback; token: number }>>({});
  // RF-44: la experiencia recién añadida, que entra con una animación breve.
  const [justAddedExperienceId, setJustAddedExperienceId] = useState<string | undefined>(undefined);
  const [ideasPulses, setIdeasPulses] = useState<Record<string, number>>({});
  // UX-07: ¿primera entrevista (sin respuestas al abrirla)? Se fija al cargar; y en qué paso va.
  const [firstInterview, setFirstInterview] = useState<boolean | null>(null);
  const [step, setStep] = useState<InterviewStep>("intro");
  // Última puntuación de las categorías desactivadas en esta visita, para devolverla al reactivarlas.
  const deactivatedScoresRef = useRef(new Map<string, LatestScoreDto>());
  const [saveStatuses, setSaveStatuses] = useState<Record<string, CategorySaveStatus>>({});
  // UX-05: la idea nueva que ha abierto el último guardado (abre "Cambios guardados").
  const [newIdea, setNewIdea] = useState<RecommendationDto | null>(null);
  const [highScoreFeedback, setHighScoreFeedback] = useState<ScoreFeedbackMessage | undefined>(undefined);
  const historyQuery = useAssessmentHistory();
  const recommendations = useRecommendations().data ?? [];
  const experiences = useExperiences().data ?? [];
  const experienceSharing = useExperienceSharing();
  const personalizeIdeas = useAiIdeasActive();
  const suggestionsActive = useAiSuggestionsActive();
  const suggestionsAvailable = useOptionalSession()?.aiIdeasAvailable === true;

  const savedScores: Record<string, number> = {};
  for (const latestScore of latestScoresQuery.data ?? []) if (latestScore.score !== undefined) savedScores[latestScore.categoryId] = latestScore.score;
  const scores: Record<string, number> = { ...savedScores, ...draftScores };
  const hasSavedAnswers = Object.keys(savedScores).length > 0;

  // Las añadidas en esta visita van primero (la más reciente arriba): así el usuario ve la pregunta que ha añadido.
  const unorderedActive = categories.filter((category) => category.status === "active");
  const activeCategories = [
    ...justAddedIds.flatMap((id) => unorderedActive.filter((category) => category.id === id)),
    ...unorderedActive.filter((category) => !justAddedIds.includes(category.id)),
  ];
  const regularCategories = categories.filter((category) => !category.isSensitiveData);
  const allRegularActive = regularCategories.length > 0 && regularCategories.every((category) => category.status === "active");

  // El historial llega del más reciente al más antiguo: lo primero que se encuentra de cada categoría es lo último.
  const lastUpdateByCategory = new Map<string, LastUpdate>();
  for (const session of historyQuery.data ?? []) {
    for (const entry of session.entries) {
      if (!lastUpdateByCategory.has(entry.categoryId)) lastUpdateByCategory.set(entry.categoryId, { recordedAt: session.recordedAt, score: entry.score, previousScore: entry.previousScore });
    }
  }

  const today = new Date().toDateString();
  function progressStatus(categoryId: string): ProgressStatus {
    if (scores[categoryId] === undefined) return { kind: "unanswered" };
    if (scores[categoryId] !== savedScores[categoryId]) return { kind: "unsaved" };
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

  const hasOpenIdea = (categoryId: string) => recommendations.some((recommendation) => recommendation.categoryId === categoryId && isOpenRecommendation(recommendation));

  /** Tras confirmarlo el servidor: "✓ Guardado" con lo que cambia (unos segundos) y, con una idea abierta, un pulso en "Ideas para…". */
  function reactToSavedTag(categoryId: string, kind: TagFeedback) {
    const token = Date.now() + Math.random();
    setTagFeedback((current) => ({ ...current, [categoryId]: { kind, token } }));
    window.setTimeout(() => setTagFeedback((current) => (current[categoryId]?.token === token ? omitKey(current, categoryId) : current)), 4000);
    // El mismo pulso para las dos listas de opciones (el texto ya dice si de verdad cambian, sin prometer de más).
    // Una experiencia (RF-44) no cambia las ideas: nunca va a la IA, así que no hay pulso.
    if ((kind === "helps" || kind === "difficulties") && hasOpenIdea(categoryId)) setIdeasPulses((current) => ({ ...current, [categoryId]: (current[categoryId] ?? 0) + 1 }));
  }

  /** RF-44: añade una experiencia al diario (sin puntuar); al confirmarlo el servidor, entra arriba de la lista. */
  async function addExperience(categoryId: string, text: string): Promise<boolean> {
    try {
      const response = await fetch("/api/categories/diary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, text }) });
      if (!response.ok) throw new Error("rejected");
      const added = (await response.json()) as ExperienceDto;
      queryClient.setQueryData<ExperienceDto[]>(EXPERIENCES_KEY, (current) => [added, ...(current ?? [])]);
      setJustAddedExperienceId(added.id);
      reactToSavedTag(categoryId, "experienceAdded");
      return true;
    } catch {
      setPageError(t("entrevista.errorExperienciaGuardar"));
      return false;
    }
  }

  /** RF-44: borra una experiencia (ya confirmado en su diálogo); se quita al momento y vuelve si el servidor falla. */
  async function deleteExperience(experience: ExperienceDto) {
    const previous = queryClient.getQueryData<ExperienceDto[]>(EXPERIENCES_KEY);
    queryClient.setQueryData<ExperienceDto[]>(EXPERIENCES_KEY, (current) => current?.filter((candidate) => candidate.id !== experience.id));
    try {
      const response = await fetch(`/api/categories/diary?id=${encodeURIComponent(experience.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("rejected");
      reactToSavedTag(experience.categoryId, "experienceDeleted");
    } catch {
      queryClient.setQueryData(EXPERIENCES_KEY, previous);
      setPageError(t("entrevista.errorExperienciaBorrar"));
    }
  }

  /** RF-43: dejar de compartir es inmediato; si el servidor falla, vuelve a estar compartida y se avisa. */
  async function unshareExperience(experience: ExperienceDto) {
    if (!(await experienceSharing.unshare(experience))) setPageError(t("entrevista.errorDejarDeCompartir"));
  }

  /** RF-45: opciones que la IA propone para una experiencia; `null` si no se pudo (la interfaz lo trata como "sin sugerencias"). */
  async function suggestOptions(experience: ExperienceDto): Promise<SuggestionsAnswer | null> {
    try {
      const response = await fetch("/api/recommendations/suggest-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId: experience.id, locale: i18n.language }),
      });
      if (!response.ok) return null;
      return (await response.json()) as SuggestionsAnswer;
    } catch {
      return null;
    }
  }

  function setCategoryDifficultyTags(id: string, difficultyTags: string[]) {
    queryClient.setQueryData<CategoryDto[]>(CATEGORIES_KEY, (current) => current?.map((category) => (category.id === id ? { ...category, difficultyTags } : category)));
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
      // Una idea pedida mientras se guardaba se escribió con las opciones de antes (y quedó en
      // la caché con la clave de las nuevas): con lo ya guardado, se vuelve a pedir (RF-40 v1.1).
      // Primero se cancela lo que esté en curso: invalidar una primera carga en curso no la repite,
      // se engancha a ella (lo destapó un E2E que fallaba 1 de cada 4 veces).
      await queryClient.cancelQueries({ queryKey: PERSONALIZED_IDEAS_KEY });
      void queryClient.invalidateQueries({ queryKey: PERSONALIZED_IDEAS_KEY });
      reactToSavedTag(category.id, "helps");
    } catch {
      setCategoryExperienceTags(category.id, previous);
      setPageError(t("entrevista.errorExperiencia"));
    }
  }

  /**
   * RF-42: marcar o desmarcar una situación se guarda al momento (optimista, se
   * deshace si el servidor falla). El carrusel de ideas la tiene en cuenta en
   * cuanto cambia la caché de categorías.
   */
  async function toggleDifficultyTag(category: CategoryDto, situation: string) {
    const previous = category.difficultyTags ?? [];
    const next = previous.includes(situation) ? previous.filter((current) => current !== situation) : [...previous, situation];
    setCategoryDifficultyTags(category.id, next);
    try {
      const response = await fetch("/api/categories/difficulties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id, tags: next }),
      });
      if (!response.ok) throw new Error("rejected");
      reactToSavedTag(category.id, "difficulties");
    } catch {
      setCategoryDifficultyTags(category.id, previous);
      setPageError(t("entrevista.errorExperiencia"));
    }
  }

  /**
   * Al activar una categoría, su última puntuación vuelve a la caché al momento. El
   * servidor solo devuelve las de las categorías activas, así que al desactivarla
   * desaparece; sin esto, la pregunta salía "sin responder" y un segundo después
   * saltaba a la puntuación guardada. Se usa la que se veía al desactivarla en esta
   * visita o, si ya venía desactivada, la última del historial (que guarda todas):
   * es justo lo que devolverá el servidor.
   */
  function restoreLatestScore(category: CategoryDto) {
    const remembered = deactivatedScoresRef.current.get(category.id);
    if (remembered) {
      queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (current) => current && [...current.filter((latestScore) => latestScore.categoryId !== category.id), remembered]);
      return;
    }
    const latestEntry = (historyQuery.data ?? []).flatMap((session) => session.entries.filter((entry) => entry.categoryId === category.id).map((entry) => ({ entry, recordedAt: session.recordedAt })))[0];
    queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (current) => {
      if (!current) return current;
      const existing = current.find((latestScore) => latestScore.categoryId === category.id);
      if (existing?.score !== undefined || !latestEntry) return existing ? current : [...current, { categoryId: category.id, catalogId: category.catalogId, categoryName: category.name }];
      const restored: LatestScoreDto = { categoryId: category.id, catalogId: category.catalogId, categoryName: category.name, score: latestEntry.entry.score, note: latestEntry.entry.note, recordedAt: latestEntry.recordedAt };
      return existing ? current.map((latestScore) => (latestScore.categoryId === category.id ? restored : latestScore)) : [...current, restored];
    });
  }

  function markJustAdded(id: string, added: boolean) {
    setJustAddedIds((current) => (added ? [id, ...current.filter((other) => other !== id)] : current.filter((other) => other !== id)));
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
    if (isOptimistic) {
      restoreLatestScore(category);
      setCategoryStatus(category.id, "active");
      markJustAdded(category.id, true);
    }

    try {
      const response = await fetch("/api/categories/activate", categoryRequest(category.id));
      const data = await response.json();

      if (!response.ok) {
        if (isOptimistic) {
          setCategoryStatus(category.id, "inactive");
          markJustAdded(category.id, false);
        }
        if (data.code === "CONSENT_REQUIRED") {
          setCategoryAwaitingConsent(category);
        } else {
          setPageError(data.error ?? t("entrevista.errorActivar"));
        }
        return false;
      }

      if (!isOptimistic) {
        restoreLatestScore(category);
        markJustAdded(category.id, true);
      }
      setCategoryStatus(category.id, "active");
      refreshResults();
      return true;
    } catch {
      if (isOptimistic) {
        setCategoryStatus(category.id, "inactive");
        markJustAdded(category.id, false);
      }
      setPageError(t("comun.errorServidor"));
      return false;
    } finally {
      markPending(category.id, false);
    }
  }

  async function deactivateCategory(category: CategoryDto) {
    if (pendingCategoryIds.has(category.id)) return;
    markPending(category.id, true);
    const shownScore = queryClient.getQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY)?.find((latestScore) => latestScore.categoryId === category.id);
    if (shownScore?.score !== undefined) deactivatedScoresRef.current.set(category.id, shownScore);
    setCategoryStatus(category.id, "inactive");
    markJustAdded(category.id, false);
    // Lo que estaba a medias de esa categoría se descarta; las evaluaciones ya guardadas se conservan.
    setDraftScores((current) => omitKey(current, category.id));

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
   * UX-05: guarda una sola categoría (el mismo POST, con una entrada). Con las
   * recomendaciones que devuelve (PERF-01): si el guardado ha abierto una idea
   * que no estaba, la enseña en "Cambios guardados"; si no, la categoría dice
   * "Guardado ahora".
   */
  async function saveCategory(categoryId: string): Promise<boolean> {
    return saveScores([categoryId]);
  }

  /** UX-12: las categorías con una nota cambiada sin guardar, en el orden de la página. */
  const unsavedIds = activeCategories.filter((category) => scores[category.id] !== undefined && scores[category.id] !== savedScores[category.id]).map((category) => category.id);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllError, setSaveAllError] = useState<string>();

  /** UX-12: "Guardar todo": todas las notas cambiadas en una sola petición (el servidor guarda todas o ninguna). */
  async function saveAll() {
    setSavingAll(true);
    setSaveAllError(undefined);
    const saved = await saveScores(unsavedIds, (message) => setSaveAllError(message));
    setSavingAll(false);
    return saved;
  }

  // UX-12: la barra de accesos queda "pegada" cuando sale por arriba, bajo la cabecera compactada (50 px):
  // entonces se pinta la compacta fija. Sin IntersectionObserver (jsdom), nunca se pega.
  const [questionsBar, setQuestionsBar] = useState<HTMLElement | null>(null);
  const [isBarStuck, setIsBarStuck] = useState(false);
  useEffect(() => {
    if (!questionsBar || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setIsBarStuck(!entry.isIntersecting && entry.boundingClientRect.top < 50), { rootMargin: "-50px 0px 0px 0px" });
    observer.observe(questionsBar);
    return () => {
      observer.disconnect();
      setIsBarStuck(false);
    };
  }, [questionsBar]);
  const questionsBarProps = {
    items: activeCategories.map((category) => ({ id: category.id, name: categoryLabel(category.catalogId).name, isUnanswered: scores[category.id] === undefined })),
    unsavedCount: unsavedIds.length,
    saving: savingAll,
    error: saveAllError ?? null,
    onGoTo: scrollToQuestion,
    onSaveAll: () => void saveAll(),
  };

  /**
   * Guarda una o varias categorías en un solo POST. El resultado se ve en cada
   * una ("Guardado ahora"). Si abre una idea nueva, "Cambios guardados"; si abre
   * varias, un aviso con enlace a Inicio (no varias ventanas seguidas). Si deja
   * todo en verde (y antes no lo estaba), el aviso de RF-50. `onError`: dónde
   * decir que falló (por defecto, en la propia categoría).
   */
  async function saveScores(categoryIds: readonly string[], onError?: (message: string) => void): Promise<boolean> {
    const entries = categoryIds.flatMap((categoryId) => (scores[categoryId] !== undefined ? [{ categoryId, score: scores[categoryId] }] : []));
    if (entries.length === 0) return false;
    const savedIds = entries.map((entry) => entry.categoryId);
    for (const categoryId of savedIds) setSaveStatus(categoryId, { kind: "saving" });
    const openBefore = new Set((queryClient.getQueryData<RecommendationDto[]>(RECOMMENDATIONS_KEY) ?? []).filter(isOpenRecommendation).map((recommendation) => recommendation.id));
    // RF-50: ¿estaba ya todo en verde antes de guardar? Solo se avisa cuando se llega, no cada vez.
    const balancedBefore = isBalanced(activeCategories.map((category) => savedScores[category.id]));
    const fail = (message: string) => {
      if (onError) {
        onError(message);
        setSaveStatuses((current) => savedIds.reduce((statuses, categoryId) => omitKey(statuses, categoryId), current));
      } else {
        for (const categoryId of savedIds) setSaveStatus(categoryId, { kind: "error", message });
      }
      return false;
    };

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const data = await response.json();
      if (!response.ok) return fail(onError ? t("entrevista.errorGuardarTodo") : (data.error ?? t("entrevista.errorGenerico")));

      // PERF-01: el servidor devuelve las últimas puntuaciones y las recomendaciones; van directas a la
      // caché y solo se vuelve a pedir el historial. Sin ellas (un servidor anterior), como antes.
      const latest = Array.isArray(data.latest) ? (data.latest as LatestScoreDto[]) : undefined;
      const updatedRecommendations = Array.isArray(data.recommendations) ? (data.recommendations as RecommendationDto[]) : undefined;
      const savedScore = (categoryId: string) => entries.find((entry) => entry.categoryId === categoryId)?.score;
      if (latest) queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, latest);
      else queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (current) => current?.map((latestScore) => (savedIds.includes(latestScore.categoryId) ? { ...latestScore, score: savedScore(latestScore.categoryId) } : latestScore)));
      setDraftScores((current) => savedIds.reduce((drafts, categoryId) => omitKey(drafts, categoryId), current));
      for (const categoryId of savedIds) setSaveStatus(categoryId, { kind: "saved" });

      if (updatedRecommendations) {
        queryClient.setQueryData<RecommendationDto[]>(RECOMMENDATIONS_KEY, updatedRecommendations);
        void queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
      } else {
        await queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
      }
      const newIdeas = (queryClient.getQueryData<RecommendationDto[]>(RECOMMENDATIONS_KEY) ?? []).filter(
        (recommendation) => savedIds.includes(recommendation.categoryId) && isOpenRecommendation(recommendation) && !openBefore.has(recommendation.id),
      );
      const nameOf = (categoryId: string) => {
        const category = categories.find((candidate) => candidate.id === categoryId);
        return category ? categoryLabel(category.catalogId).name : "";
      };
      /** UX-09: el mensaje de nota alta de una categoría (si le toca uno). */
      const highScoreOf = (entry: { categoryId: string; score: number }) => {
        const savedCategory = categories.find((category) => category.id === entry.categoryId);
        if (!savedCategory) return undefined;
        const label = categoryLabel(savedCategory.catalogId);
        const isSensitive = savedCategory.isSensitiveData === true;
        const feedback = scoreFeedback({ score: entry.score, isSensitive, canShare: !isSensitive && !label.aiExcluded });
        return feedback ? { ...feedback, categoryName: label.name, score: entry.score } : undefined;
      };
      const reachedBalance = !balancedBefore && isBalanced(activeCategories.map((category) => savedScore(category.id) ?? savedScores[category.id]));

      if (entries.length === 1) {
        // Una sola categoría (su "Guardar"): la ventana si abre una idea; si no, el aviso de todo en verde o el de nota alta.
        if (newIdeas.length === 1) setNewIdea(newIdeas[0]);
        const highScore = highScoreOf(entries[0]);
        setHighScoreFeedback(reachedBalance ? { kind: "balanced" } : highScore);
        return true;
      }

      // UX-12, "Guardar todo": ningún aviso se pierde. Todo en verde, cada idea nueva y cada nota alta, juntos.
      const highScores = entries.flatMap((entry) => highScoreOf(entry) ?? []);
      const items = [
        ...(reachedBalance ? [t("entrevista.todoEnVerde")] : []),
        ...newIdeas.map((recommendation) => t("entrevista.ideaNuevaPara", { categoria: nameOf(recommendation.categoryId) })),
        ...highScores.map((feedback) => t(`entrevista.puntuacionAlta.${feedback.tone}${feedback.inviteToShare ? "Compartir" : ""}`, { categoria: feedback.categoryName, puntuacion: feedback.score })),
      ];
      if (items.length === 1 && newIdeas.length === 1) setNewIdea(newIdeas[0]);
      else if (items.length === 1 && reachedBalance) setHighScoreFeedback({ kind: "balanced" });
      else if (items.length > 0) setHighScoreFeedback({ kind: "summary", items, linkToHome: newIdeas.length > 0 || reachedBalance, centered: reachedBalance });
      else setHighScoreFeedback(undefined);
      return true;
    } catch {
      return fail(onError ? t("entrevista.errorGuardarTodo") : t("comun.errorServidor"));
    }
  }

  const categorySelection = (
    <CategorySelection categories={categories} categoryLabel={categoryLabel} pendingCategoryIds={pendingCategoryIds} onToggle={toggleCategory} onToggleAllRegular={() => void toggleAllRegular()} />
  );

  if (categoriesQuery.isPending || latestScoresQuery.isPending || labelsPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // UX-07: se decide una vez, al cargar (estado ajustado durante el render, como recomienda React para
  // recordar algo de renders anteriores). Guardar la primera categoría no saca al usuario de sus pasos.
  if (firstInterview === null) setFirstInterview(!hasSavedAnswers);
  const isFirstInterview = firstInterview ?? !hasSavedAnswers;
  const showQuestions = !isFirstInterview || step === "questions";
  // UX-06: las categorías, en la columna derecha en escritorio y encima de las preguntas en móvil (un solo ejemplar).
  const selectionInAside = showQuestions && isDesktop;

  function goToStep(next: InterviewStep) {
    setStep(next);
    document.getElementById("entrevista-titulo")?.scrollIntoView?.({ block: "start" });
  }

  const introBubble = (
    <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
      <Typography variant="body1">{isFirstInterview ? t("entrevista.descripcion") : t("entrevista.descripcionActualizar")}</Typography>
      {/* UX-01: la primera vez, los pasos concretos de esta pantalla; al actualizar ya se conocen. */}
      {isFirstInterview && (
        <Box component="ol" aria-label={t("entrevista.pasosTitulo")} sx={{ my: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {(t("entrevista.pasosPrimeraVez", { returnObjects: true, boton: t("entrevista.guardar") }) as string[]).map((text) => (
            <Typography component="li" variant="body2" key={text}>
              {text}
            </Typography>
          ))}
        </Box>
      )}
      <Typography variant="caption" color="text.secondary">
        {t("entrevista.escala")}
      </Typography>
    </Bubble>
  );

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: showQuestions ? "minmax(0, 1fr) 280px" : "minmax(0, 1fr)" }, alignItems: "start" }}>
    {/* Dos bloques con fondo distinto (UX-06): la introducción y, debajo, las preguntas. */}
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
    <Box component="section" aria-labelledby="entrevista-titulo" sx={{ ...MODULE_STYLES, bgcolor: PALE_TINT, scrollMarginTop: 72 }}>
      {/* La entrevista es la primera vez; con respuestas guardadas, la misma pantalla se presenta como "actualizarlas". */}
      <Typography id="entrevista-titulo" variant="h5" component="h1">
        {isFirstInterview ? t("entrevista.titulo") : t("entrevista.tituloActualizar")}
      </Typography>
      {isFirstInterview && <InterviewSteps active={step} />}

      {/* Sin reintentos automáticos (ver createQueryClient), pero el usuario puede pedirlo: si no, el error se quedaba hasta volver a entrar. */}
      {(categoriesQuery.isError || latestScoresQuery.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (categoriesQuery.isError) void categoriesQuery.refetch();
                if (latestScoresQuery.isError) void latestScoresQuery.refetch();
              }}
            >
              {t("comun.reintentar")}
            </Button>
          }
        >
          {t("entrevista.errorCarga")}
        </Alert>
      )}
      {pageError && <Alert severity="error">{pageError}</Alert>}

      {isFirstInterview && step === "intro" && (
        <>
          {introBubble}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" size="large" onClick={() => goToStep("categories")}>
              {t("entrevista.empezar")}
            </Button>
          </Box>
        </>
      )}

      {isFirstInterview && step === "categories" && (
        <>
          <Box>
            <Typography variant="h6" component="h2">
              {t("entrevista.queHablarTitulo")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("entrevista.queHablarTexto")}
            </Typography>
          </Box>
          <CategoryPicker categories={categories} categoryLabel={categoryLabel} pendingCategoryIds={pendingCategoryIds} onToggle={toggleCategory} onToggleAllRegular={() => void toggleAllRegular()} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Button onClick={() => goToStep("intro")}>{t("entrevista.atras")}</Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {activeCategories.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t("entrevista.eligeUna")}
                </Typography>
              )}
              <Button variant="contained" size="large" disabled={activeCategories.length === 0} onClick={() => goToStep("questions")}>
                {t("entrevista.irAPreguntas")}
              </Button>
            </Box>
          </Box>
        </>
      )}

      {showQuestions &&
        (isFirstInterview ? (
          // En la primera entrevista ya se leyó en el paso 1: queda plegada, por si se quiere releer.
          <Accordion disableGutters elevation={0} sx={{ bgcolor: "rgba(255, 255, 255, 0.6)", borderRadius: 0, "&::before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" component="span">
                {t("entrevista.releerIntro")}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>{introBubble}</AccordionDetails>
          </Accordion>
        ) : (
          introBubble
        ))}
      {showQuestions && !selectionInAside && categorySelection}
    </Box>

    {showQuestions && (
    <Box component="section" aria-labelledby="entrevista-preguntas" sx={{ ...MODULE_STYLES, bgcolor: "background.default", pt: { xs: 1, sm: 1.5 } }}>
      {activeCategories.length > 0 && (
        <Typography id="entrevista-preguntas" variant="h6" component="h2">
          {t("entrevista.preguntasTitulo")}
        </Typography>
      )}

      {activeCategories.length > 0 && (
        // UX-12: los accesos a cada pregunta y "Guardar todo". Al bajar, cuando esta barra queda bajo la
        // cabecera, la sustituye una compacta fija (abajo); esta se oculta para que no haya dos botones.
        <Box ref={setQuestionsBar} sx={{ mx: { xs: -2, sm: -4 }, px: { xs: 2, sm: 4 }, py: 1.5, borderBottom: 1, borderColor: "divider", visibility: isBarStuck ? "hidden" : "visible" }}>
          <QuestionsBar {...questionsBarProps} />
        </Box>
      )}
      {activeCategories.length > 0 && (
        <Fade in={isBarStuck} unmountOnExit>
          <Box
            data-testid="questions-bar-compact"
            sx={{
              position: "fixed",
              // Debajo de la cabecera ya compactada (48 px más su borde de 2), de lado a lado.
              top: 50,
              left: 0,
              right: 0,
              zIndex: (theme) => theme.zIndex.appBar - 1,
              bgcolor: "background.default",
              borderBottom: 1,
              borderColor: "divider",
              boxShadow: 2,
            }}
          >
            <Box sx={{ maxWidth: WIDE_PAGE_MAX_WIDTH, mx: "auto", px: 2, py: 0.75 }}>
              <QuestionsBar {...questionsBarProps} compact />
            </Box>
          </Box>
        </Fade>
      )}

      {activeCategories.map((category) => (
        <CategoryQuestion
          key={category.id}
          category={category}
          justAdded={justAddedIds.includes(category.id)}
          label={categoryLabel(category.catalogId)}
          score={scores[category.id]}
          scoreChanged={scores[category.id] !== savedScores[category.id]}
          lastUpdate={lastUpdateByCategory.get(category.id)}
          saveStatus={saveStatuses[category.id]}
          recommendation={recommendations.find((recommendation) => recommendation.categoryId === category.id && isOpenRecommendation(recommendation))}
          personalizeIdeas={personalizeIdeas}
          experiences={experiences.filter((experience) => experience.categoryId === category.id)}
          justAddedExperienceId={justAddedExperienceId}
          onAddExperience={addExperience}
          onDeleteExperience={(experience) => void deleteExperience(experience)}
          onSuggestOptions={suggestionsActive ? suggestOptions : undefined}
          suggestionsAvailable={suggestionsAvailable}
          savedScore={savedScores[category.id]}
          onShareExperience={(experience) => experienceSharing.share(experience, i18n.language)}
          onUnshareExperience={(experience) => void unshareExperience(experience)}
          onScore={(categoryId, score) => setDraftScores((current) => ({ ...current, [categoryId]: score }))}
          onToggleTag={(target, tag) => void toggleExperienceTag(target, tag)}
          onToggleDifficulty={(target, situation) => void toggleDifficultyTag(target, situation)}
          tagFeedback={tagFeedback[category.id]?.kind}
          ideasPulse={ideasPulses[category.id]}
          onSave={saveCategory}
        />
      ))}

      {activeCategories.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.elegirAlgo")}
        </Typography>
      )}

    </Box>
    )}

    <SavedIdeaDialog
      recommendation={newIdea}
      categoryName={newIdea ? categoryLabel(newIdea.catalogId).name : ""}
      categoryKey={newIdea ? categoryLabel(newIdea.catalogId).key : undefined}
      personalize={personalizeIdeas}
      onClose={() => setNewIdea(null)}
    />

    <ScoreFeedbackToast feedback={highScoreFeedback} onClose={() => setHighScoreFeedback(undefined)} />
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
    {/* Columna derecha (escritorio): categorías al actualizar y, debajo, el progreso. Fija entera al
        desplazarse, bajo la cabecera compacta (48 px); si no cabe en la pantalla, se desplaza por dentro. */}
    {showQuestions && (
    <Box sx={{ display: { xs: "none", lg: "block" }, alignSelf: "stretch" }}>
      <Box sx={{ position: "sticky", top: 64, maxHeight: "calc(100vh - 80px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, ...SOFT_SCROLLBAR }}>
        {selectionInAside && categorySelection}
        {activeCategories.length > 0 && (
          <InterviewProgress
            items={activeCategories.map((category) => ({ categoryId: category.id, name: categoryLabel(category.catalogId).name, status: progressStatus(category.id) }))}
            onSelect={scrollToQuestion}
          />
        )}
      </Box>
    </Box>
    )}
    {showQuestions && <ScrollToTopButton />}
    </Box>
  );
}
