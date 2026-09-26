import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import interviewerAvatar from "../../../assets/avatars/interviewer.svg";
import userAvatar from "../../../assets/avatars/user.svg";
import { BandBackground } from "./BandBackground";
import { CATEGORIES_KEY, useCategories, type CategoryDto } from "@modules/categories/ui/queries";
import { InterviewHistory } from "./InterviewHistory";
import { ASSESSMENTS_KEY, LATEST_SCORES_KEY, useLatestScores } from "./queries";
import type { LatestScoreDto } from "./ScoreCards";
import { scoreBand, type ScoreBand } from "./scoreBand";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Categorías activas todavía sin respuesta: un tono lila suave, para recordar
 * sin alarmar (RN-04) — ni rojo ni icono de aviso. Colores planos.
 */
const PENDING_COLORS = { bg: "#EEEAFB", fg: "#4B3F8F", border: "#C9BDF2" };

/** Lleva a la pregunta de una categoría; sin animación si el usuario prefiere menos movimiento. */
function scrollToQuestion(categoryId: string) {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  document.getElementById(`pregunta-${categoryId}`)?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

/** Etiqueta pequeña "Sin responder". */
function PendingBadge({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{ px: 1, py: 0.25, borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, bgcolor: PENDING_COLORS.bg, color: PENDING_COLORS.fg, whiteSpace: "nowrap" }}
    >
      {label}
    </Box>
  );
}

/** El catálogo estándar no tiene slug; se enlaza por nombre con las claves de `ejemplos.*` en i18n. */
const EXAMPLES_KEY: Record<string, string> = {
  Economía: "economia",
  "Vida social": "vidaSocial",
  Pareja: "pareja",
  Sexo: "sexo",
  Deporte: "deporte",
  Aventura: "aventura",
  Espiritualidad: "espiritualidad",
  Familia: "familia",
  Inversiones: "inversiones",
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

/** Icono "i" en círculo (Material) inline — evita añadir la dependencia @mui/icons-material solo para uno. */
function InfoIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </SvgIcon>
  );
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _omitted, ...rest } = record;
  void _omitted;
  return rest;
}

const categoryRequest = (categoryId: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ categoryId }),
});

/** Burbuja de conversación — el entrevistador a la izquierda, el usuario a la derecha. */
function Bubble({ children, side, avatar, alt, band }: { children: React.ReactNode; side: "left" | "right"; avatar: string; alt: string; band?: ScoreBand }) {
  const isLeft = side === "left";
  return (
    <Box sx={{ display: "flex", flexDirection: isLeft ? "row" : "row-reverse", alignItems: "flex-start", gap: 1.5 }}>
      <Avatar src={avatar} alt={alt} sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, flexShrink: 0 }} />
      <Box
        data-band={band}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: isLeft ? "#FFFFFF" : "#F3EFFB",
          border: "1px solid",
          borderColor: isLeft ? "#D9ECE8" : "#E2DAF3",
          borderRadius: isLeft ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
          px: 2,
          py: 1.5,
          minWidth: 0,
          flex: isLeft ? "0 1 auto" : 1,
        }}
      >
        <BandBackground band={band} />
        <Box sx={{ position: "relative" }}>{children}</Box>
      </Box>
    </Box>
  );
}

/**
 * Vista de RF-10 — la "entrevista personal", siempre editable. Mobile-first
 * (ADR-07 §6). Diseño relajado a propósito (paleta suave, esquinas
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
 * Ver docs/user-stories/RF-10-entrevista.md.
 */
export function InterviewPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const latestScoresQuery = useLatestScores();
  const categories = categoriesQuery.data ?? [];
  // Solo lo que el usuario ha cambiado en esta pantalla; el resto sale de la última puntuación guardada.
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});
  const [categoryAwaitingConsent, setCategoryAwaitingConsent] = useState<CategoryDto | null>(null);
  const [isSendingConsent, setIsSendingConsent] = useState(false);
  // Categorías con una petición en curso: evita dobles clics contradictorios y enseña un indicador en las sensibles.
  const [pendingCategoryIds, setPendingCategoryIds] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const savedScores: Record<string, number> = {};
  for (const latestScore of latestScoresQuery.data ?? []) if (latestScore.score !== undefined) savedScores[latestScore.categoryId] = latestScore.score;
  const scores: Record<string, number> = { ...savedScores, ...draftScores };
  const hasSavedAnswers = Object.keys(savedScores).length > 0;

  const activeCategories = categories.filter((category) => category.status === "active");
  const regularCategories = categories.filter((category) => !category.isSensitiveData);
  const sensitiveCategories = categories.filter((category) => category.isSensitiveData);
  const allRegularActive = regularCategories.length > 0 && regularCategories.every((category) => category.status === "active");
  const anyActive = activeCategories.length > 0;
  const anyRegularActive = regularCategories.some((category) => category.status === "active");
  const changedCategories = activeCategories.filter((category) => scores[category.id] !== undefined && (scores[category.id] !== savedScores[category.id] || notes[category.id]?.trim()));

  function setCategoryStatus(id: string, status: "active" | "inactive") {
    queryClient.setQueryData<CategoryDto[]>(CATEGORIES_KEY, (current) => current?.map((category) => (category.id === id ? { ...category, status } : category)));
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
          setSaveState({ kind: "error", message: data.error ?? t("entrevista.errorActivar") });
        }
        return false;
      }

      setCategoryStatus(category.id, "active");
      refreshResults();
      return true;
    } catch {
      if (isOptimistic) setCategoryStatus(category.id, "inactive");
      setSaveState({ kind: "error", message: t("comun.errorServidor") });
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
    setNotes((current) => omitKey(current, category.id));

    try {
      const response = await fetch("/api/categories/deactivate", categoryRequest(category.id));
      if (!response.ok) {
        const data = await response.json();
        setCategoryStatus(category.id, "active");
        setSaveState({ kind: "error", message: data.error ?? t("entrevista.errorActivar") });
        return;
      }
      refreshResults();
    } catch {
      setCategoryStatus(category.id, "active");
      setSaveState({ kind: "error", message: t("comun.errorServidor") });
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
        setSaveState({ kind: "error", message: data.error ?? t("entrevista.errorActivar") });
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

  async function saveChanges(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ kind: "saving" });

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: changedCategories.map((category) => ({
            categoryId: category.id,
            score: scores[category.id],
            ...(notes[category.id]?.trim() ? { note: notes[category.id].trim() } : {}),
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSaveState({ kind: "error", message: data.error ?? t("entrevista.errorGenerico") });
        return;
      }

      // La caché se actualiza al momento con lo guardado (Resultados/Inicio ya lo ven) y se confirma en segundo plano.
      queryClient.setQueryData<LatestScoreDto[]>(LATEST_SCORES_KEY, (current) =>
        current?.map((latestScore) => (draftScores[latestScore.categoryId] !== undefined && changedCategories.some((category) => category.id === latestScore.categoryId) ? { ...latestScore, score: draftScores[latestScore.categoryId] } : latestScore)),
      );
      setDraftScores({});
      setNotes({});
      setOpenNotes({});
      void queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY });
      setSaveState({ kind: "saved" });
    } catch {
      setSaveState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  const renderCategoryRow = (category: CategoryDto) => (
    <Box key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <FormControlLabel
      control={<Checkbox checked={category.status === "active"} onChange={() => toggleCategory(category)} />}
      label={
        <Box>
          <Typography variant="body1" component="span">
            {category.name}
          </Typography>
          {category.description && (
            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
              {category.description}
            </Typography>
          )}
        </Box>
      }
    />
  {pendingCategoryIds.has(category.id) && category.isSensitiveData && (
      <CircularProgress size={16} aria-label={category.name} />
    )}
    </Box>
  );

  if (categoriesQuery.isPending || latestScoresQuery.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" }, alignItems: "start", mt: { xs: 1, sm: 3 } }}>
    <Box
      component="form"
      onSubmit={saveChanges}
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
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.escala")}
        </Typography>
      </Bubble>

      {(categoriesQuery.isError || latestScoresQuery.isError) && <Alert severity="error">{t("entrevista.errorCarga")}</Alert>}
      {saveState.kind === "error" && <Alert severity="error">{saveState.message}</Alert>}
      {saveState.kind === "saved" && (
        <Alert severity="success">
          {t("entrevista.exito")}{" "}
          <Link component={RouterLink} to="/perfil/resultados">
            {t("entrevista.verResultados")}
          </Link>
        </Alert>
      )}

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
        <Box component="nav" aria-label={t("entrevista.irA")} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                {category.name}
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
        <Box
          key={category.id}
          id={`pregunta-${category.id}`}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            scrollMarginTop: 16,
            pl: 1.5,
            // Mismo ancho de borde siempre, para que contestar no desplace nada.
            borderLeft: "3px solid",
            borderColor: scores[category.id] === undefined ? PENDING_COLORS.border : "transparent",
          }}
        >
          <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Typography variant="body1">{t("entrevista.pregunta", { categoria: category.name })}</Typography>
              {scores[category.id] === undefined && <PendingBadge label={t("entrevista.sinResponder")} />}
              {EXAMPLES_KEY[category.name] && (
                <IconButton
                  size="small"
                  aria-label={t("entrevista.verEjemplos", { categoria: category.name })}
                  aria-expanded={openExamples[category.id] === true}
                  onClick={() => setOpenExamples((current) => ({ ...current, [category.id]: !current[category.id] }))}
                >
                  <InfoIcon />
                </IconButton>
              )}
            </Box>
            {EXAMPLES_KEY[category.name] && (
              <Collapse in={openExamples[category.id] === true}>
                <Typography variant="caption" color="text.secondary">
                  {t("entrevista.ejemplosTitulo")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                  {(t(`ejemplos.${EXAMPLES_KEY[category.name]}`, { returnObjects: true }) as string[]).map((example) => (
                    <Typography key={example} component="li" variant="body2">
                      {example}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            )}
          </Bubble>
          <Bubble side="right" avatar={userAvatar} alt={t("entrevista.tu")} band={scores[category.id] !== undefined ? scoreBand(scores[category.id]) : undefined}>
            <Box role="group" aria-label={t("entrevista.puntuacionDe", { categoria: category.name })} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {SCORES.map((score) => {
                return (
                  <ToggleButton
                    key={score}
                    value={score}
                    size="small"
                    selected={scores[category.id] === score}
                    onChange={() => setDraftScores((current) => ({ ...current, [category.id]: score }))}
                    sx={{ minWidth: 40, "&.Mui-selected": { fontWeight: 700 } }}
                  >
                    {score}
                  </ToggleButton>
                );
              })}
            </Box>
            {openNotes[category.id] ? (
              <TextField
                label={t("entrevista.nota")}
                value={notes[category.id] ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [category.id]: event.target.value }))}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                size="small"
                fullWidth
                sx={{ mt: 1.5 }}
              />
            ) : (
              <Button size="small" onClick={() => setOpenNotes((current) => ({ ...current, [category.id]: true }))} sx={{ mt: 0.5 }}>
                {t("entrevista.anadirNota")}
              </Button>
            )}
          </Bubble>
        </Box>
      ))}

      {changedCategories.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {anyActive ? t("entrevista.sinCambios") : t("entrevista.elegirAlgo")}
        </Typography>
      )}
      <Button type="submit" variant="contained" size="large" fullWidth disabled={changedCategories.length === 0 || saveState.kind === "saving"}>
        {saveState.kind === "saving" ? t("entrevista.guardando") : t("entrevista.guardar")}
      </Button>

      <Dialog open={categoryAwaitingConsent !== null} onClose={() => setCategoryAwaitingConsent(null)}>
        <DialogTitle>{t("categorias.modalTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("categorias.modalTexto", { categoria: categoryAwaitingConsent?.name ?? "" })}</DialogContentText>
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
    <InterviewHistory />
    </Box>
  );
}
