import { useCallback, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { keyframes, useTheme } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import TerrainOutlinedIcon from "@mui/icons-material/TerrainOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";
import interviewerAvatar from "../../../../assets/avatars/interviewer.svg";
import userAvatar from "../../../../assets/avatars/user.svg";
import type { CategoryLabel } from "@modules/categories/ui/categoryLabels";
import type { CategoryDto } from "@modules/categories/ui/queries";
import { experienceOptionsFor } from "@modules/categories/domain/experienceOptions";
import { allowedTemplateKeys, situationOptionsFor } from "@modules/recommendations/domain/ideaSituations";
import { DEFAULT_THRESHOLD } from "@modules/recommendations/domain/recommendationCatalog";
import { RecommendationButton } from "@modules/recommendations/ui/RecommendationButton";
import type { RecommendationDto } from "@modules/recommendations/ui/queries";
import { scoreBand } from "../scoreBand";
import { Bubble, PendingBadge } from "./Bubble";
import { PENDING_COLORS } from "./pendingColors";
import { ExpandToggle } from "./ExpandToggle";
import { ExperienceNote } from "./ExperienceNote";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Oculto a la vista pero leído por el lector de pantalla. */
const VISUALLY_HIDDEN = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

/** Fila de un título desplegable y, a su derecha, su "✓ …": nunca se parte, así que al irse el mensaje no salta nada. */
const TOGGLE_ROW = { display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 } as const;

/** Entrada de una pregunta recién añadida: de la derecha, solo con transform y opacity (las baratas de animar). */
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(48px); }
  to { opacity: 1; transform: none; }
`;

export type CategorySaveStatus = { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

export interface LastUpdate {
  recordedAt: string;
  score: number;
  previousScore?: number;
}

export interface LastExperience {
  note: string;
  recordedAt: string;
}

interface CategoryQuestionProps {
  category: CategoryDto;
  /** Añadida en esta visita (UX-06): entra con una animación breve. */
  justAdded?: boolean;
  label: CategoryLabel;
  /** Puntuación que se ve: la cambiada en esta pantalla o, si no, la guardada. */
  score?: number;
  /** La puntuación que se ve no es la guardada. */
  scoreChanged: boolean;
  lastUpdate?: LastUpdate;
  lastExperience?: LastExperience;
  saveStatus?: CategorySaveStatus;
  /** Su idea abierta (RF-18), si la tiene: la pregunta ofrece "Ideas para…". */
  recommendation?: RecommendationDto;
  /** RF-40 activo: las ideas se personalizan. */
  personalizeIdeas: boolean;
  onScore: (categoryId: string, score: number) => void;
  onToggleTag: (category: CategoryDto, tag: string) => void;
  /** RF-41/RF-42: el servidor acaba de confirmar una opción marcada (para decir qué cambia). */
  tagFeedback?: "helps" | "difficulties";
  /** Cuántas veces han cambiado sus ideas en esta visita: cada cambio, un pulso en "Ideas para…". */
  ideasPulse?: number;
  /** RF-42: marcar o desmarcar una situación que se lo pone difícil. */
  onToggleDifficulty: (category: CategoryDto, situation: string) => void;
  /** Guarda esta categoría; `true` si se guardó (la experiencia escrita vuelve a empezar vacía). */
  onSave: (categoryId: string, note: string | undefined) => Promise<boolean>;
  /** Solo cuando pasa de vacía a con texto o al revés (para el progreso); escribir no repinta la página. */
  onNoteStateChange: (categoryId: string, hasNote: boolean) => void;
}

/**
 * Una categoría de la entrevista (RF-10): la pregunta con sus ejemplos, la
 * puntuación, "¿Qué te ayuda?" (RF-41), "¿Qué te lo pone difícil?" con una
 * puntuación baja (RF-42), la última actualización y la última
 * experiencia, la experiencia nueva y su propio "Guardar" (UX-05). El texto de
 * la experiencia vive aquí: escribir solo vuelve a pintar esta pregunta.
 */
export function CategoryQuestion({ category, justAdded = false, label, score, scoreChanged, lastUpdate, lastExperience, saveStatus, recommendation, personalizeIdeas, tagFeedback, ideasPulse = 0, onScore, onToggleTag, onToggleDifficulty, onSave, onNoteStateChange }: CategoryQuestionProps) {
  const { t, i18n } = useTranslation();
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [helpsOpen, setHelpsOpen] = useState(false);
  const [difficultiesOpen, setDifficultiesOpen] = useState(false);
  const isWide = useMediaQuery(useTheme().breakpoints.up("sm"), { noSsr: true });
  const noteRef = useRef("");
  const [hasNote, setHasNote] = useState(false);
  const hasNoteRef = useRef(false);
  // Al guardar, el campo de experiencia vuelve a empezar vacío y cerrado.
  const [noteVersion, setNoteVersion] = useState(0);

  const isUnanswered = score === undefined;
  const isSaving = saveStatus?.kind === "saving";
  const hasChanges = !isUnanswered && (scoreChanged || hasNote);
  const experienceOptions = experienceOptionsFor(label.key);
  const experienceTags = category.experienceTags ?? [];
  // RF-42: solo con una puntuación baja (el umbral por defecto de RF-18) o una idea abierta.
  const difficultyOptions = situationOptionsFor(label.key);
  const difficultyTags = category.difficultyTags ?? [];
  const asksDifficulties = difficultyOptions.length > 0 && ((score !== undefined && score < DEFAULT_THRESHOLD) || recommendation !== undefined);
  // RF-42: qué cambia de verdad al marcar una opción (sin prometer lo que no pasa: "¿Qué te ayuda?" sin IA no cambia nada visible).
  // A la derecha del título de su lista, en la misma fila: al irse no hace saltar nada.
  // En pantallas anchas, visible a la derecha; en móvil no cabe y la confirmación se ve dentro del título
  // (`savedTagInline`), pero el aviso para el lector de pantalla es siempre este, fuera del botón.
  const savedTagStatus = (
    <Typography role="status" variant="body2" sx={isWide ? { display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, color: "success.dark" } : VISUALLY_HIDDEN}>
      {isWide && <CheckCircleOutlineIcon fontSize="small" sx={{ flexShrink: 0 }} />}
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {feedbackText()}
      </Box>
    </Typography>
  );
  const savedTagInline = (
    <Box component="span" aria-hidden sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "success.dark" }}>
      <CheckCircleOutlineIcon fontSize="small" />
      {feedbackText()}
    </Box>
  );
  function feedbackText() {
    if (!tagFeedback) return null;
    if (tagFeedback === "helps" && !personalizeIdeas) return t("entrevista.guardadoSolo");
    if (!recommendation) return t("entrevista.guardadoProximasIdeas");
    return tagFeedback === "difficulties" ? t("entrevista.guardadoIdeasActualizadas") : t("entrevista.guardadoIdeasEnCuenta");
  }
  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });

  const handleNoteChange = useCallback(
    (categoryId: string, text: string) => {
      noteRef.current = text;
      const nowHasNote = text.trim().length > 0;
      if (nowHasNote === hasNoteRef.current) return;
      hasNoteRef.current = nowHasNote;
      setHasNote(nowHasNote);
      onNoteStateChange(categoryId, nowHasNote);
    },
    [onNoteStateChange],
  );

  async function save() {
    const note = noteRef.current.trim();
    const saved = await onSave(category.id, note || undefined);
    if (!saved) return;
    noteRef.current = "";
    hasNoteRef.current = false;
    setHasNote(false);
    onNoteStateChange(category.id, false);
    setNoteVersion((version) => version + 1);
  }

  return (
    <Box
      id={`pregunta-${category.id}`}
      data-just-added={justAdded || undefined}
      sx={{
        ...(justAdded && { animation: `${slideIn} 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both` }),
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        // Al saltar a una pregunta, que no quede bajo la cabecera fija (48 px compacta).
        scrollMarginTop: 72,
        pl: 1.5,
        // Mismo ancho de borde siempre, para que contestar no desplace nada.
        borderLeft: "3px solid",
        borderColor: isUnanswered ? PENDING_COLORS.border : "transparent",
      }}
    >
      <Bubble side="left" avatar={interviewerAvatar} alt={t("entrevista.entrevistador")}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
          <Typography variant="body1">{t("entrevista.pregunta", { categoria: label.name })}</Typography>
          {isUnanswered && <PendingBadge label={t("entrevista.sinResponder")} />}
          {label.key && (
            <IconButton size="small" aria-label={t("entrevista.verEjemplos", { categoria: label.name })} aria-expanded={examplesOpen} onClick={() => setExamplesOpen((open) => !open)}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        {label.key && (
          <Collapse in={examplesOpen}>
            <Typography variant="caption" color="text.secondary">
              {t("entrevista.ejemplosTitulo")}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
              {(t(`ejemplos.${label.key}`, { returnObjects: true }) as string[]).map((example) => (
                <Typography key={example} component="li" variant="body2">
                  {example}
                </Typography>
              ))}
            </Box>
          </Collapse>
        )}
        {/* UX-05: lo último que se guardó de esta categoría (el historial completo está en Resultados). */}
        {lastUpdate && (
          <Box data-last-update sx={{ mt: 1, pt: 1, borderTop: "1px dashed #D5DEDB" }}>
            <Typography variant="caption" color="text.secondary" component="p">
              {t("entrevista.ultimaActualizacion", {
                fecha: formatDate(lastUpdate.recordedAt),
                cambio: lastUpdate.previousScore !== undefined ? `${lastUpdate.previousScore} → ${lastUpdate.score}` : String(lastUpdate.score),
              })}
            </Typography>
            {lastExperience && (
              <>
                <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
                  {t("entrevista.ultimaExperiencia", { fecha: formatDate(lastExperience.recordedAt) })}
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic", overflowWrap: "anywhere" }}>
                  «{lastExperience.note}»
                </Typography>
              </>
            )}
          </Box>
        )}
      </Bubble>
      <Bubble side="right" avatar={userAvatar} alt={t("entrevista.tu")} band={isUnanswered ? undefined : scoreBand(score)}>
        {/* UX-05: el "Guardar" de la categoría, a la derecha de su puntuación (debajo si no cabe). */}
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 2, rowGap: 1 }}>
          <Box role="group" aria-label={t("entrevista.puntuacionDe", { categoria: label.name })} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {SCORES.map((value) => (
              <ToggleButton key={value} value={value} size="small" selected={score === value} onChange={() => onScore(category.id, value)} sx={{ minWidth: { xs: 40, lg: 36 }, px: { lg: 1 }, "&.Mui-selected": { fontWeight: 700 } }}>
                {value}
              </ToggleButton>
            ))}
          </Box>
          <Button variant="contained" size="small" aria-label={t("entrevista.guardarCategoria", { categoria: label.name })} disabled={!hasChanges || isSaving} onClick={() => void save()}>
            {isSaving ? t("entrevista.guardando") : t("entrevista.guardar")}
          </Button>
          {/* Se quita en cuanto la categoría vuelve a tener cambios sin guardar. */}
          {saveStatus?.kind === "saved" && !hasChanges && (
            <Typography role="status" variant="body2" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "success.dark" }}>
              <CheckCircleOutlineIcon fontSize="small" />
              {t("entrevista.guardadoAhora")}
            </Typography>
          )}
        </Box>
        {experienceOptions.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box sx={TOGGLE_ROW}>
              <ExpandToggle icon={<VolunteerActivismOutlinedIcon />} open={helpsOpen} onToggle={() => setHelpsOpen((open) => !open)} status={!isWide && tagFeedback === "helps" ? savedTagInline : undefined}>
                {experienceTags.length > 0 ? t("entrevista.queTeAyudaMarcadas", { count: experienceTags.length }) : t("entrevista.queTeAyuda")}
              </ExpandToggle>
              {tagFeedback === "helps" && savedTagStatus}
            </Box>
            <Collapse in={helpsOpen} unmountOnExit>
              <Typography variant="caption" color="text.secondary" component="p">
                {t("entrevista.queTeAyudaTexto")}
              </Typography>
              <Box role="group" aria-label={`${t("entrevista.queTeAyuda")} ${label.name}`} sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                {experienceOptions.map((option) => {
                  const selected = experienceTags.includes(option);
                  return (
                    <Chip
                      key={option}
                      label={t(`experiencias.${option}`)}
                      clickable
                      size="small"
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      aria-pressed={selected}
                      onClick={() => onToggleTag(category, option)}
                    />
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        )}
        {asksDifficulties && (
          <Box sx={{ mt: 0.5 }}>
            <Box sx={TOGGLE_ROW}>
              <ExpandToggle icon={<TerrainOutlinedIcon />} open={difficultiesOpen} onToggle={() => setDifficultiesOpen((open) => !open)} status={!isWide && tagFeedback === "difficulties" ? savedTagInline : undefined}>
                {difficultyTags.length > 0 ? t("entrevista.queTeLoPoneDificilMarcadas", { count: difficultyTags.length }) : t("entrevista.queTeLoPoneDificil")}
              </ExpandToggle>
              {tagFeedback === "difficulties" && savedTagStatus}
            </Box>
            <Collapse in={difficultiesOpen} unmountOnExit>
              <Typography variant="caption" color="text.secondary" component="p">
                {t("entrevista.queTeLoPoneDificilTexto")}
              </Typography>
              <Box role="group" aria-label={`${t("entrevista.queTeLoPoneDificil")} ${label.name}`} sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                {difficultyOptions.map((situation) => {
                  const selected = difficultyTags.includes(situation);
                  return (
                    <Chip
                      key={situation}
                      label={t(`situaciones.${situation}`)}
                      clickable
                      size="small"
                      color={selected ? "secondary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      aria-pressed={selected}
                      onClick={() => onToggleDifficulty(category, situation)}
                    />
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        )}
        <ExperienceNote key={noteVersion} categoryId={category.id} onChange={handleNoteChange} />
        {/* UX-05: con una idea abierta, las ideas están a un toque; debajo de las tres opciones de la pregunta (y cambian con "¿Qué te ayuda?" si RF-40 está activo). */}
        {recommendation && (
          <Box sx={{ mt: 1.5 }}>
            <RecommendationButton
              pulseKey={ideasPulse}
              recommendationId={recommendation.id}
              categoryId={category.id}
              personalize={personalizeIdeas}
              templateKey={recommendation.templateKey}
              categoryName={label.name}
              label={t("entrevista.ideasPara", { categoria: label.name, count: allowedTemplateKeys(label.key, difficultyTags).length })}
            />
          </Box>
        )}
        {saveStatus?.kind === "error" && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {saveStatus.message}
          </Alert>
        )}
      </Bubble>
    </Box>
  );
}
