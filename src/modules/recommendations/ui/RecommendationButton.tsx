import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import { keyframes } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { sharedExperiencesKey, useSharedExperiences, type SharedExperienceDto } from "@modules/assessments/ui/queries";
import { useCategories } from "@modules/categories/ui/queries";
import { HelpLink } from "@shared/ui/components/HelpLink";
import type { IdeaReactionKind } from "../domain/IdeaReaction";
import { allowedTemplateKeys } from "../domain/ideaSituations";
import { templateKeysFor } from "../domain/recommendationCatalog";
import { type IdeaReactionDto, useIdeaReactions, useSetIdeaReaction, visibleIdeaKeys } from "./ideaReactions";
import { IdeaPlan } from "./IdeaPlan";
import { usePersonalizedIdea } from "./queries";

/** Tono "idea" amarillo suave: destaca sin sonar a aviso ni a error (RN-04, RES-07). */
const IDEA_COLORS = { background: "#FFF6D6", text: "#6B4E00", border: "#F1D98A", hoverBackground: "#FDEFBE" };

interface RecommendationButtonProps {
  templateKey: string;
  /** Nombre ya en el idioma de la interfaz (lo resuelve la página). */
  categoryName: string;
  /** Texto del botón; por defecto "Una idea para ti" (el resumen de Inicio lo nombra por su categoría). */
  label?: string;
  /** RF-40: id de la recomendación, para pedir su versión personalizada. */
  recommendationId?: string;
  /** RF-40 v1.1: su categoría, para volver a pedir la idea si cambia "¿Qué te ayuda?". */
  categoryId?: string;
  /**
   * Clave de su categoría en el catálogo (`economia`): decide qué ideas ofrece el carrusel. Sin ella,
   * se deduce de la plantilla, que falla con una idea general de una categoría con ideas propias.
   */
  categoryKey?: string;
  /** RF-40: la función está disponible y el usuario la activó (lo decide la página con `useAiIdeasActive`). */
  personalize?: boolean;
  /**
   * RF-42: cuántas veces han cambiado las ideas; cada cambio, un pulso suave del botón. Se reinicia solo
   * el botón (su `key`), no la ventana: una `key` en todo el componente la cerraba si estaba abierta.
   */
  pulseKey?: number;
}

/** Un pulso suave del botón (solo `transform`), dos veces; nada con "reducir movimiento". */
const ideasPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
`;

/**
 * Recomendación de una categoría (RF-18): en la tarjeta solo se ve un botón
 * destacado "Una idea para ti", para que el usuario sepa que hay una propuesta
 * sin llenarle la pantalla de texto; la idea y el aviso de RES-05 se leen en
 * una ventana al pulsarlo. Sin ventanas que se abran solas (RES-07).
 * RF-40: si el usuario activó las ideas con IA, la ventana pide la versión
 * personalizada (la primera vez tarda un poco; luego sale de la caché) y la
 * muestra con su etiqueta en la pestaña "Con IA" (la original, en "De la app").
 * Ante cualquier respuesta que no sea una idea de IA, se ve el texto curado.
 * RF-43: lo que comparten otras personas, en la pestaña "De otras personas".
 */
export function RecommendationButton({ templateKey, categoryName, label, recommendationId, categoryId, categoryKey, personalize = false, pulseKey = 0 }: RecommendationButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button
        key={pulseKey}
        size="small"
        startIcon={<LightbulbOutlinedIcon fontSize="small" />}
        aria-haspopup="dialog"
        data-highlighted="true"
        data-pulse={pulseKey > 0 || undefined}
        onClick={() => setOpen(true)}
        sx={{
          ...(pulseKey > 0 && { animation: `${ideasPulse} 450ms ease-in-out 2` }),
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          alignSelf: "flex-start",
          mt: 0.5,
          px: 1.5,
          borderRadius: 999,
          border: "1px solid",
          borderColor: IDEA_COLORS.border,
          bgcolor: IDEA_COLORS.background,
          color: IDEA_COLORS.text,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: IDEA_COLORS.hoverBackground },
        }}
      >
        {label ?? t("recomendaciones.titulo")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} fullWidth maxWidth="sm">
        <DialogTitle id={titleId}>{t("recomendaciones.dialogoTitulo", { categoria: categoryName })}</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 1, sm: 2 } }}>
          <IdeaContent templateKey={templateKey} categoryName={categoryName} recommendationId={recommendationId} categoryId={categoryId} categoryKey={categoryKey} personalize={personalize} />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 4 }, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>{t("recomendaciones.cerrar")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface IdeaContentProps {
  /** La idea recomendada: la primera del carrusel. */
  templateKey: string;
  categoryName: string;
  recommendationId?: string;
  categoryId?: string;
  categoryKey?: string;
  personalize?: boolean;
}

/**
 * Las ideas del carrusel: las del catálogo de la categoría de la plantilla que no chocan con lo que
 * se le pone difícil (RF-42), empezando por la recomendada si se puede ("economia.3" → 3, 1, 2, 4, 5).
 */
function carouselKeys(templateKey: string, difficultyTags: readonly string[], categoryKey?: string): string[] {
  const allowed = allowedTemplateKeys(catalogKeyOf(templateKey, categoryKey), difficultyTags);
  return allowed.includes(templateKey) ? [templateKey, ...allowed.filter((key) => key !== templateKey)] : allowed;
}

/** La misma regla que el servidor (PersonalizeRecommendation): por la clave de la categoría, no de la plantilla. */
function catalogKeyOf(templateKey: string, categoryKey?: string): string | undefined {
  const prefix = templateKey.split(".")[0];
  return categoryKey ?? (prefix === "general" ? undefined : prefix);
}

/** Altura común de las pestañas, para que la ventana no salte al cambiar de una a otra. */
const PANEL_MIN_HEIGHT = { xs: 300, sm: 340 };

/** Botones redondos con el color de la marca: las flechas del carrusel. */
const ARROW_SX = { bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } };

/**
 * Las ideas de una categoría en un carrusel (UX-05): primero la recomendada y
 * después el resto del catálogo curado, con "anterior/siguiente". Con RF-40
 * activo, en pestañas: "De la app" y "Con IA" (la misma idea, personalizada);
 * con experiencias compartidas en la categoría (RF-43), "De otras personas".
 * El aviso de RES-05 se ve siempre. Lo comparten esta ventana y la de
 * "Cambios guardados" de la entrevista.
 */
export function IdeaContent(props: IdeaContentProps) {
  return props.categoryId ? <IdeaCarouselForCategory {...props} categoryId={props.categoryId} /> : <IdeaCarousel {...props} difficultyTags={[]} shared={[]} />;
}

/**
 * RF-42: con su categoría, el carrusel quita las ideas que chocan; espera a tener las categorías para no enseñarlas ni un momento.
 * RF-43: y pide lo que comparten otras personas en ella (solo con la ventana abierta; luego, de la caché).
 */
function IdeaCarouselForCategory(props: IdeaContentProps & { categoryId: string }) {
  const { t, i18n } = useTranslation();
  const categoriesQuery = useCategories();
  const sharedQuery = useSharedExperiences(props.categoryId, i18n.language, true);
  // RF-19: sus reacciones a las ideas (guardada, descartada), de la caché.
  const reactionsQuery = useIdeaReactions();
  const setIdeaReaction = useSetIdeaReaction();
  if (categoriesQuery.data === undefined && !categoriesQuery.isError) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {t("comun.cargando")}
        </Typography>
      </Box>
    );
  }
  const categories = categoriesQuery.data;
  const difficultyTags = (Array.isArray(categories) ? categories.find((category) => category.id === props.categoryId)?.difficultyTags : undefined) ?? [];
  // Los botones salen con las reacciones ya cargadas: un "Me gusta" pulsado antes lo pisaba la respuesta de esa carga (fallo visto en el E2E de móvil).
  const reactions: IdeaReactions | undefined = reactionsQuery.isPending
    ? undefined
    : { list: Array.isArray(reactionsQuery.data) ? reactionsQuery.data : [], set: (templateKey, reaction, plannedFor) => setIdeaReaction(props.categoryId, templateKey, reaction, plannedFor) };
  return <IdeaCarousel {...props} difficultyTags={difficultyTags} shared={Array.isArray(sharedQuery.data) ? sharedQuery.data : []} reactions={reactions} />;
}

type IdeaTab = "app" | "ai" | "others";

/** RF-19: las reacciones del usuario y cómo cambiar la de una idea. Solo cuando el carrusel es de una categoría suya. */
interface IdeaReactions {
  list: readonly IdeaReactionDto[];
  set: (templateKey: string, reaction: IdeaReactionKind | null, plannedFor?: string | null) => Promise<boolean>;
}

function IdeaCarousel({ templateKey, categoryName, recommendationId, categoryId, categoryKey, personalize = false, difficultyTags, shared, reactions }: IdeaContentProps & { difficultyTags: readonly string[]; shared: SharedExperienceDto[]; reactions?: IdeaReactions }) {
  const { t } = useTranslation();
  const tabsId = useId();
  const withAi = personalize && recommendationId !== undefined;
  const [reportedOne, setReportedOne] = useState(false);
  const tabs: IdeaTab[] = ["app", ...(withAi ? (["ai"] as const) : []), ...(shared.length > 0 || reportedOne ? (["others"] as const) : [])];
  const [chosenTab, setTab] = useState<IdeaTab>(withAi ? "ai" : "app");
  const tab = tabs.includes(chosenTab) ? chosenTab : tabs[0];
  // RF-19: las ideas que la persona descartó en esta categoría no vuelven a salir.
  const ownReactions = reactions?.list ?? [];
  const [reactionFailed, setReactionFailed] = useState(false);
  const allKeys = carouselKeys(templateKey, difficultyTags, categoryKey);
  const keys = visibleIdeaKeys(allKeys, ownReactions, categoryId);
  const [rawIndex, setIndex] = useState(0);
  // Si la lista se acorta con la ventana abierta (se marcó una situación), el índice no se sale.
  const index = Math.min(rawIndex, Math.max(keys.length - 1, 0));
  const currentKey = keys[index];
  const curatedText = t(`recomendaciones.plantillas.${currentKey}`, { categoria: categoryName });
  const move = (step: number) => setIndex((index + step + keys.length) % keys.length);
  // Las que no se ven: por lo marcado en "se me pone difícil" (RF-42) o porque las apartó (RF-19).
  const hiddenBySituations = Math.max(templateKeysFor(catalogKeyOf(templateKey, categoryKey)).length - allKeys.length, 0);
  const discardedCount = allKeys.length - keys.length;
  const [savedNotice, setSavedNotice] = useState<string>();
  const savedReaction = ownReactions.find((reaction) => reaction.categoryId === categoryId && reaction.templateKey === currentKey && reaction.reaction === "saved");
  const isSaved = savedReaction !== undefined;

  async function react(key: string, reaction: IdeaReactionKind | null, plannedFor?: string | null) {
    if (!reactions) return;
    setReactionFailed(!(await reactions.set(key, reaction, plannedFor)));
  }

  async function like() {
    if (isSaved) {
      setSavedNotice(undefined);
      await react(currentKey, null);
      return;
    }
    setSavedNotice(currentKey);
    await react(currentKey, "saved");
  }

  // "Me gusta" la guarda; "no me gusta" la aparta. Solo con una categoría detrás (no en una idea suelta).
  const actions = reactions && categoryId ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip title={t("recomendaciones.meGusta")}>
        <IconButton color="primary" aria-label={t("recomendaciones.meGusta")} aria-pressed={isSaved} onClick={() => void like()} sx={{ border: 1, borderColor: "primary.main", ...(isSaved && ARROW_SX) }}>
          {isSaved ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={t("recomendaciones.noMeGusta")}>
        <IconButton color="primary" aria-label={t("recomendaciones.noMeGusta")} onClick={() => void react(currentKey, "discarded")} sx={{ border: 1, borderColor: "primary.main" }}>
          <ThumbDownOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  ) : undefined;

  // Lo que pasa tras pulsar: se dice en texto, no solo con el color del botón.
  const feedback = (
    <Box role="status" sx={{ minHeight: 24 }}>
      {reactionFailed ? (
        <Typography variant="body2" color="error">
          {t("recomendaciones.errorReaccion")}
        </Typography>
      ) : (
        isSaved && savedNotice === currentKey && <Typography variant="body2">{t("recomendaciones.ideaGuardada")}</Typography>
      )}
      {/* RF-47: una fecha orientativa para la guardada; recién guardada, la pregunta sale abierta. */}
      {isSaved && <IdeaPlan key={`${currentKey}-${savedNotice === currentKey}`} plannedFor={savedReaction.plannedFor} defaultOpen={savedNotice === currentKey && !savedReaction.plannedFor} onChange={(plannedFor) => void react(currentKey, "saved", plannedFor)} />}
    </Box>
  );

  const recoverAll = () => void Promise.all(allKeys.map((key) => react(key, null)));
  const hiddenNotes = (
    <>
      {discardedCount > 0 && keys.length > 0 && (
        <Typography variant="caption" color="text.secondary" component="p">
          {t("recomendaciones.apartadas", { count: discardedCount })}{" "}
          <Link component="button" type="button" variant="caption" onClick={recoverAll}>
            {t("recomendaciones.recuperar")}
          </Link>
        </Typography>
      )}
      {hiddenBySituations > 0 && (
        <Typography variant="caption" color="text.secondary" component="p">
          {t("recomendaciones.ocultasPorSituacion", { count: hiddenBySituations })}
        </Typography>
      )}
    </>
  );

  const tabLabel = (value: IdeaTab) => (value === "app" ? t("recomendaciones.pestanaApp") : value === "ai" ? t("recomendaciones.pestanaIa") : t("recomendaciones.pestanaOtros", { count: shared.length }));

  return (
    <>
      {tabs.length > 1 && (
        <Tabs
          value={tab}
          onChange={(_, value: IdeaTab) => setTab(value)}
          variant="fullWidth"
          sx={{
            mb: 3,
            minHeight: 44,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTabs-flexContainer": { gap: 1 },
            // Pestañas con aspecto de botón: la elegida, rellena con el color de la marca.
            "& .MuiTab-root": { minHeight: 44, px: 1, textTransform: "none", fontSize: "0.9rem", border: 1, borderColor: "primary.main", borderRadius: 1, color: "primary.main" },
            "& .MuiTab-root.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" },
          }}
        >
          {tabs.map((value) => (
            <Tab key={value} value={value} label={tabLabel(value)} id={`${tabsId}-${value}`} aria-controls={`${tabsId}-panel`} />
          ))}
        </Tabs>
      )}
      <Box role={tabs.length > 1 ? "tabpanel" : undefined} id={`${tabsId}-panel`} aria-labelledby={tabs.length > 1 ? `${tabsId}-${tab}` : undefined} sx={{ minHeight: PANEL_MIN_HEIGHT, display: "flex", flexDirection: "column" }}>
        {tab === "others" && categoryId ? (
          <SharedExperiencesList experiences={shared} categoryId={categoryId} reported={reportedOne} onReported={() => setReportedOne(true)} />
        ) : keys.length === 0 ? (
          // Las descartó todas: se dice, y se pueden recuperar.
          <Box>
            <DialogContentText sx={{ color: "text.primary", mb: 1.5 }}>{t("recomendaciones.sinIdeas")}</DialogContentText>
            <Button size="small" variant="outlined" onClick={recoverAll}>
              {t("recomendaciones.recuperar")}
            </Button>
          </Box>
        ) : (
          <IdeaSlides
            actions={actions}
            feedback={feedback}
            hiddenNotes={hiddenNotes}
            keys={keys}
            index={index}
            move={move}
            curatedText={curatedText}
            personalized={tab === "ai" && recommendationId ? { recommendationId, categoryId } : undefined}
          />
        )}
      </Box>
    </>
  );
}

interface IdeaSlidesProps {
  keys: string[];
  index: number;
  move: (step: number) => void;
  curatedText: string;
  /** RF-40: la pestaña "Con IA". */
  personalized?: { recommendationId: string; categoryId?: string };
  /** RF-19: "me gusta" (la guarda) o "no me gusta" (la aparta) para la idea que se ve. */
  actions?: React.ReactNode;
  /** RF-19: el mensaje tras reaccionar. */
  feedback?: React.ReactNode;
  /** Cuántas ideas no se ven y por qué. */
  hiddenNotes?: React.ReactNode;
}

/** La idea que se ve (curada o personalizada), el carrusel y el aviso de RES-05. */
function IdeaSlides({ keys, index, move, curatedText, personalized, actions, feedback, hiddenNotes }: IdeaSlidesProps) {
  const { t } = useTranslation();
  const currentKey = keys[index];
  return (
    <>
      {/* La idea, destacada: en la segunda prueba pasaba desapercibida entre el resto de la ventana. Crece hasta llenar la pestaña. */}
      <Box aria-live="polite" sx={{ flexGrow: 1, minHeight: 120, mb: 2, p: { xs: 2, sm: 3 }, bgcolor: "background.default" }}>
        {personalized ? (
          <PersonalizedIdea key={currentKey} recommendationId={personalized.recommendationId} templateKey={currentKey} categoryId={personalized.categoryId} curatedText={curatedText} />
        ) : (
          <DialogContentText sx={IDEA_TEXT_SX}>{curatedText}</DialogContentText>
        )}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: actions ? "space-between" : "center", gap: 2, mb: 1 }}>
        {actions}
        {keys.length > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton size="small" aria-label={t("recomendaciones.ideaAnterior")} onClick={() => move(-1)} sx={ARROW_SX}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {t("recomendaciones.ideaPosicion", { actual: index + 1, total: keys.length })}
            </Typography>
            <IconButton size="small" aria-label={t("recomendaciones.ideaSiguiente")} onClick={() => move(1)} sx={ARROW_SX}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      {feedback}
      {hiddenNotes}
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("recomendaciones.aviso")}
      </Typography>
    </>
  );
}

/** El texto de la idea, algo mayor que el resto de la ventana. */
const IDEA_TEXT_SX = { color: "text.primary", fontSize: "1.1rem", lineHeight: 1.5 };

/**
 * Solo se monta con la ventana abierta y para la idea que se ve: la petición se
 * hace al verla, no al pintar la tarjeta ni por adelantado.
 */
interface PersonalizedIdeaProps {
  recommendationId: string;
  templateKey: string;
  categoryId?: string;
  curatedText: string;
}

function PersonalizedIdea({ recommendationId, templateKey, categoryId, curatedText }: PersonalizedIdeaProps) {
  const { t, i18n } = useTranslation();
  // Las opciones de "¿Qué te ayuda?" salen de la caché de categorías (la entrevista la actualiza al marcarlas).
  // Se espera a tenerlas: si no, se pedía con "sin opciones" y otra vez al llegar (dos peticiones).
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data;
  const categoriesReady = !categoryId || categories !== undefined || categoriesQuery.isError;
  const experienceTags = (Array.isArray(categories) ? categories.find((category) => category.id === categoryId)?.experienceTags : undefined) ?? [];
  const { data, isPending } = usePersonalizedIdea(recommendationId, templateKey, i18n.language, experienceTags, categoriesReady);

  if (isPending) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {t("recomendaciones.personalizando")}
        </Typography>
      </Box>
    );
  }

  if (data?.source !== "ai") {
    return (
      <>
        <DialogContentText sx={IDEA_TEXT_SX}>{curatedText}</DialogContentText>
        {/* RF-40b: si es por el tope diario, se dice; ante un fallo del proveedor, solo la idea original. */}
        {data?.notice === "limit" && (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
            {t("recomendaciones.limiteIa")}
          </Typography>
        )}
      </>
    );
  }

  return (
    <Box>
      <Chip icon={<AutoAwesomeOutlinedIcon fontSize="small" />} label={t("recomendaciones.personalizadaConIa")} size="small" variant="outlined" sx={{ mb: 1.5 }} />
      <DialogContentText sx={IDEA_TEXT_SX}>{data.text}</DialogContentText>
    </Box>
  );
}

interface SharedExperiencesListProps {
  experiences: SharedExperienceDto[];
  categoryId: string;
  /** Ya se ha reportado una en esta ventana: se dan las gracias. */
  reported: boolean;
  onReported: () => void;
}

/**
 * RF-43: lo que comparten otras personas a las que les va bien en esta área:
 * solo el texto, con el aviso de que no es consejo profesional (RES-05).
 * Reportar la oculta al momento para todos (sin moderador que la revise antes).
 */
function SharedExperiencesList({ experiences, categoryId, reported, onReported }: SharedExperiencesListProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);

  async function report(experience: SharedExperienceDto) {
    setFailed(false);
    try {
      const response = await fetch("/api/categories/shared", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: experience.id }) });
      if (!response.ok) throw new Error("rejected");
      queryClient.setQueryData<SharedExperienceDto[]>(sharedExperiencesKey(categoryId, i18n.language), (current) => current?.filter((candidate) => candidate.id !== experience.id));
      onReported();
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        {experiences.map((experience) => (
          <Box component="li" key={experience.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
              {experience.text}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button size="small" color="inherit" startIcon={<FlagOutlinedIcon fontSize="small" />} onClick={() => void report(experience)} sx={{ textTransform: "none", color: "text.secondary" }}>
                {t("recomendaciones.reportar")}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      <Box aria-live="polite">
        {reported && (
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            {t("recomendaciones.reportada")}
          </Typography>
        )}
        {failed && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {t("recomendaciones.errorReportar")}
          </Typography>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("recomendaciones.avisoOtros")}
      </Typography>
      {/* RF-30: junto a lo que escriben otras personas. */}
      <Box sx={{ mt: 0.5 }}>
        <HelpLink />
      </Box>
    </>
  );
}
