import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
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
import { SHARE_MIN_SCORE } from "../../domain/Experience";
import type { ExperienceDto, ShareOutcome } from "../queries";
import { ExperienceJournal, type ExperienceSharing, type ExperienceSuggestions } from "./ExperienceJournal";
import { ToggleRow } from "./ToggleRow";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
  saveStatus?: CategorySaveStatus;
  /** Su idea abierta (RF-18), si la tiene: la pregunta ofrece "Ideas para…". */
  recommendation?: RecommendationDto;
  /** RF-40 activo: las ideas se personalizan. */
  personalizeIdeas: boolean;
  onScore: (categoryId: string, score: number) => void;
  onToggleTag: (category: CategoryDto, tag: string) => void;
  /** RF-41/RF-42/RF-44: el servidor acaba de confirmar algo de una de sus listas (para decir qué cambia). */
  tagFeedback?: TagFeedback;
  /** Cuántas veces han cambiado sus ideas en esta visita: cada cambio, un pulso en "Ideas para…". */
  ideasPulse?: number;
  /** RF-42: marcar o desmarcar una situación que se lo pone difícil. */
  onToggleDifficulty: (category: CategoryDto, situation: string) => void;
  /** Guarda la puntuación de esta categoría. */
  onSave: (categoryId: string) => Promise<boolean>;
  /** RF-44: su diario de experiencias (la más reciente primero) y la recién añadida, si la hay. */
  experiences: ExperienceDto[];
  justAddedExperienceId?: string;
  onAddExperience: (categoryId: string, text: string) => Promise<boolean>;
  onDeleteExperience: (experience: ExperienceDto) => void;
  /** RF-45: pide a la IA opciones para una experiencia; solo con las sugerencias activadas. */
  onSuggestOptions?: (experience: ExperienceDto) => Promise<{ helps: string[]; difficulties: string[] } | null>;
  /** RF-45: la función existe en este despliegue (aunque el usuario no la haya activado). */
  suggestionsAvailable?: boolean;
  /** RF-43: la última puntuación guardada (no la que se está cambiando), que decide si se puede compartir. */
  savedScore?: number;
  /** RF-43: compartir o dejar de compartir una experiencia. */
  onShareExperience?: (experience: ExperienceDto) => Promise<ShareOutcome>;
  onUnshareExperience?: (experience: ExperienceDto) => void;
}

export type TagFeedback = "helps" | "difficulties" | "experienceAdded" | "experienceDeleted";

/**
 * Una categoría de la entrevista (RF-10): la pregunta con sus ejemplos, la
 * puntuación con su propio "Guardar" (UX-05), "¿Qué te ayuda?" (RF-41), "¿Qué
 * te lo pone difícil?" con una puntuación baja (RF-42), el diario de experiencias
 * (RF-44, con su propio "Añadir") y, debajo, "Ideas para…".
 */
export function CategoryQuestion({
  category,
  justAdded = false,
  label,
  score,
  scoreChanged,
  lastUpdate,
  saveStatus,
  recommendation,
  personalizeIdeas,
  tagFeedback,
  ideasPulse = 0,
  onScore,
  onToggleTag,
  onToggleDifficulty,
  onSave,
  experiences,
  justAddedExperienceId,
  onAddExperience,
  onDeleteExperience,
  onSuggestOptions,
  suggestionsAvailable = false,
  savedScore,
  onShareExperience,
  onUnshareExperience,
}: CategoryQuestionProps) {
  const { t, i18n } = useTranslation();
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [helpsOpen, setHelpsOpen] = useState(false);
  const [difficultiesOpen, setDifficultiesOpen] = useState(false);
  // RF-45: nunca en categorías sensibles, en las excluidas de la IA (Pareja) ni en las que no tienen listas (sin clave del catálogo).
  const suggestions: ExperienceSuggestions | undefined =
    onSuggestOptions && !category.isSensitiveData && !label.aiExcluded && label.key
      ? {
          onSuggest: onSuggestOptions,
          onAccept: (kind, key) => {
            // Como si lo tocara el usuario; si ya estaba marcada, no se desmarca.
            if (kind === "helps" && !(category.experienceTags ?? []).includes(key)) onToggleTag(category, key);
            if (kind === "difficulties" && !(category.difficultyTags ?? []).includes(key)) onToggleDifficulty(category, key);
          },
        }
      : undefined;
  // RF-43: mismas categorías que la IA (ni sensibles ni Pareja) y la misma regla que el servidor: última puntuación de 8 o más.
  const sharing: ExperienceSharing | undefined =
    onShareExperience && onUnshareExperience
      ? {
          canShare: !category.isSensitiveData && !label.aiExcluded && Boolean(label.key) && savedScore !== undefined && savedScore >= SHARE_MIN_SCORE,
          onShare: onShareExperience,
          onUnshare: onUnshareExperience,
        }
      : undefined;
  const isUnanswered = score === undefined;
  const isSaving = saveStatus?.kind === "saving";
  const hasChanges = !isUnanswered && scoreChanged;
  const experienceOptions = experienceOptionsFor(label.key);
  const experienceTags = category.experienceTags ?? [];
  // RF-42: solo con una puntuación baja (el umbral por defecto de RF-18) o una idea abierta.
  const difficultyOptions = situationOptionsFor(label.key);
  const difficultyTags = category.difficultyTags ?? [];
  const asksDifficulties = difficultyOptions.length > 0 && ((score !== undefined && score < DEFAULT_THRESHOLD) || recommendation !== undefined);
  // RF-42: qué cambia de verdad al marcar una opción (sin prometer lo que no pasa: "¿Qué te ayuda?" sin IA no cambia nada visible).
  function feedbackText(kind: TagFeedback) {
    if (tagFeedback !== kind) return null;
    if (kind === "experienceAdded") return t("entrevista.experienciaGuardada");
    if (kind === "experienceDeleted") return t("entrevista.experienciaBorrada");
    if (tagFeedback === "helps" && !personalizeIdeas) return t("entrevista.guardadoSolo");
    if (!recommendation) return t("entrevista.guardadoProximasIdeas");
    return kind === "difficulties" ? t("entrevista.guardadoIdeasActualizadas") : t("entrevista.guardadoIdeasEnCuenta");
  }
  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });

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
          <Button variant="contained" size="small" aria-label={t("entrevista.guardarCategoria", { categoria: label.name })} disabled={!hasChanges || isSaving} onClick={() => void onSave(category.id)}>
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
            <ToggleRow icon={<VolunteerActivismOutlinedIcon />} open={helpsOpen} onToggle={() => setHelpsOpen((open) => !open)} statusText={feedbackText("helps")}>
              {experienceTags.length > 0 ? t("entrevista.queTeAyudaMarcadas", { count: experienceTags.length }) : t("entrevista.queTeAyuda")}
            </ToggleRow>
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
            <ToggleRow icon={<TerrainOutlinedIcon />} open={difficultiesOpen} onToggle={() => setDifficultiesOpen((open) => !open)} statusText={feedbackText("difficulties")}>
              {difficultyTags.length > 0 ? t("entrevista.queTeLoPoneDificilMarcadas", { count: difficultyTags.length }) : t("entrevista.queTeLoPoneDificil")}
            </ToggleRow>
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
        <ExperienceJournal
          experiences={experiences}
          justAddedId={justAddedExperienceId}
          statusText={feedbackText("experienceAdded") ?? feedbackText("experienceDeleted")}
          onAdd={(text) => onAddExperience(category.id, text)}
          onDelete={onDeleteExperience}
          suggestions={suggestions}
          suggestionsHint={suggestionsAvailable && !category.isSensitiveData && !label.aiExcluded && Boolean(label.key)}
          sharing={sharing}
        />
        {/* UX-05: con una idea abierta, las ideas están a un toque; debajo de las tres opciones de la pregunta (y cambian con "¿Qué te ayuda?" si RF-40 está activo). */}
        {recommendation && (
          <Box sx={{ mt: 1.5 }}>
            <RecommendationButton
              pulseKey={ideasPulse}
              recommendationId={recommendation.id}
              categoryId={category.id}
              categoryKey={label.key}
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
