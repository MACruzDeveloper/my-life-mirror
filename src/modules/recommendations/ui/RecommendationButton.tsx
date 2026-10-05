import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { keyframes } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useCategories } from "@modules/categories/ui/queries";
import { allowedTemplateKeys } from "../domain/ideaSituations";
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
 * muestra con su etiqueta y la idea original a un clic. Ante cualquier
 * respuesta que no sea una idea de IA, se ve el texto curado de siempre.
 */
export function RecommendationButton({ templateKey, categoryName, label, recommendationId, categoryId, personalize = false, pulseKey = 0 }: RecommendationButtonProps) {
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
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={titleId} fullWidth maxWidth="xs">
        <DialogTitle id={titleId}>{t("recomendaciones.dialogoTitulo", { categoria: categoryName })}</DialogTitle>
        <DialogContent>
          <IdeaContent templateKey={templateKey} categoryName={categoryName} recommendationId={recommendationId} categoryId={categoryId} personalize={personalize} />
        </DialogContent>
        <DialogActions>
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
  personalize?: boolean;
}

/**
 * Las ideas del carrusel: las del catálogo de la categoría de la plantilla que no chocan con lo que
 * se le pone difícil (RF-42), empezando por la recomendada si se puede ("economia.3" → 3, 1, 2, 4, 5).
 */
function carouselKeys(templateKey: string, difficultyTags: readonly string[]): string[] {
  const prefix = templateKey.split(".")[0];
  const allowed = allowedTemplateKeys(prefix === "general" ? undefined : prefix, difficultyTags);
  return allowed.includes(templateKey) ? [templateKey, ...allowed.filter((key) => key !== templateKey)] : allowed;
}

/**
 * Las ideas de una categoría en un carrusel (UX-05): primero la recomendada y
 * después el resto del catálogo curado, con "anterior/siguiente". Cada una,
 * personalizada si RF-40 está activo; el aviso de RES-05 se ve siempre. Lo
 * comparten esta ventana y la de "Cambios guardados" de la entrevista.
 */
export function IdeaContent(props: IdeaContentProps) {
  return props.categoryId ? <IdeaCarouselForCategory {...props} categoryId={props.categoryId} /> : <IdeaCarousel {...props} difficultyTags={[]} />;
}

/** RF-42: con su categoría, el carrusel quita las ideas que chocan; espera a tener las categorías para no enseñarlas ni un momento. */
function IdeaCarouselForCategory(props: IdeaContentProps & { categoryId: string }) {
  const { t } = useTranslation();
  const categoriesQuery = useCategories();
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
  return <IdeaCarousel {...props} difficultyTags={difficultyTags} />;
}

function IdeaCarousel({ templateKey, categoryName, recommendationId, categoryId, personalize = false, difficultyTags }: IdeaContentProps & { difficultyTags: readonly string[] }) {
  const { t } = useTranslation();
  const keys = carouselKeys(templateKey, difficultyTags);
  const [rawIndex, setIndex] = useState(0);
  // Si la lista se acorta con la ventana abierta (se marcó una situación), el índice no se sale.
  const index = Math.min(rawIndex, Math.max(keys.length - 1, 0));
  const currentKey = keys[index];
  const curatedText = t(`recomendaciones.plantillas.${currentKey}`, { categoria: categoryName });
  const move = (step: number) => setIndex((index + step + keys.length) % keys.length);

  return (
    <>
      <Box aria-live="polite" sx={{ minHeight: 96 }}>
        {personalize && recommendationId ? (
          <PersonalizedIdea key={currentKey} recommendationId={recommendationId} templateKey={currentKey} categoryId={categoryId} categoryName={categoryName} curatedText={curatedText} />
        ) : (
          <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{curatedText}</DialogContentText>
        )}
      </Box>
      {keys.length > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1.5 }}>
          <IconButton size="small" aria-label={t("recomendaciones.ideaAnterior")} onClick={() => move(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {t("recomendaciones.ideaPosicion", { actual: index + 1, total: keys.length })}
          </Typography>
          <IconButton size="small" aria-label={t("recomendaciones.ideaSiguiente")} onClick={() => move(1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
      <Typography variant="caption" color="text.secondary" component="p">
        {t("recomendaciones.aviso")}
      </Typography>
    </>
  );
}

/**
 * Solo se monta con la ventana abierta y para la idea que se ve: la petición se
 * hace al verla, no al pintar la tarjeta ni por adelantado.
 */
interface PersonalizedIdeaProps {
  recommendationId: string;
  templateKey: string;
  categoryId?: string;
  categoryName: string;
  curatedText: string;
}

function PersonalizedIdea({ recommendationId, templateKey, categoryId, categoryName, curatedText }: PersonalizedIdeaProps) {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  // Las opciones de "¿Qué te ayuda?" salen de la caché de categorías (la entrevista la actualiza al marcarlas).
  // Se espera a tenerlas: si no, se pedía con "sin opciones" y otra vez al llegar (dos peticiones).
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data;
  const categoriesReady = !categoryId || categories !== undefined || categoriesQuery.isError;
  const experienceTags = (Array.isArray(categories) ? categories.find((category) => category.id === categoryId)?.experienceTags : undefined) ?? [];
  const { data, isPending } = usePersonalizedIdea(recommendationId, templateKey, i18n.language, experienceTags, categoriesReady);

  if (isPending) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {t("recomendaciones.personalizando")}
        </Typography>
      </Box>
    );
  }

  if (data?.source !== "ai") {
    return <DialogContentText sx={{ color: "text.primary", mb: 2 }}>{curatedText}</DialogContentText>;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Chip icon={<AutoAwesomeOutlinedIcon fontSize="small" />} label={t("recomendaciones.personalizadaConIa")} size="small" variant="outlined" sx={{ mb: 1 }} />
      <DialogContentText sx={{ color: "text.primary" }}>{data.text}</DialogContentText>
      <Link component="button" type="button" variant="body2" onClick={() => setShowOriginal((current) => !current)} sx={{ mt: 1 }}>
        {showOriginal ? t("recomendaciones.ocultarOriginal") : t("recomendaciones.verOriginal")}
      </Link>
      {showOriginal && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t(`recomendaciones.plantillas.${data.templateKey}`, { categoria: categoryName })}
        </Typography>
      )}
    </Box>
  );
}
