import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import Link from "@mui/material/Link";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { hasOffensiveTerms } from "@modules/recommendations/domain/offensiveTerms";
import type { ExperienceDto } from "../queries";
import { ToggleRow } from "./ToggleRow";

/** Las que se ven sin pulsar "Ver todas". */
const VISIBLE_EXPERIENCES = 3;
const MAX_LENGTH = 500;

/** Entrada de una experiencia recién añadida: solo transform y opacity. */
const appear = keyframes`
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: none; }
`;

export type SuggestionKind = "helps" | "difficulties";

/** RF-45: solo si el usuario las activó y la categoría no es sensible; sin esto, no hay botón. */
export interface ExperienceSuggestions {
  /** Pide las opciones para esa experiencia; `null` si no se pudo (se trata como "sin sugerencias"). */
  onSuggest: (experience: ExperienceDto) => Promise<{ helps: string[]; difficulties: string[] } | null>;
  /** Aceptar una propuesta la marca como si la tocara el usuario (RF-41 / RF-42). */
  onAccept: (kind: SuggestionKind, key: string) => void;
}

interface ExperienceJournalProps {
  /** Las de esta categoría, la más reciente primero. */
  experiences: ExperienceDto[];
  /** "✓ Guardada" / "✓ Borrada" tras confirmarlo el servidor. */
  statusText?: string | null;
  /** La recién añadida, que entra con una animación breve. */
  justAddedId?: string;
  /** Guarda la experiencia; `true` si se guardó (el campo vuelve a empezar vacío). */
  onAdd: (text: string) => Promise<boolean>;
  onDelete: (experience: ExperienceDto) => void;
  suggestions?: ExperienceSuggestions;
  /** RF-45: la función existe pero el usuario no la ha activado; se le dice dónde (sin esto, no hay forma de descubrirla aquí). */
  suggestionsHint?: boolean;
}

/**
 * RF-45: las propuestas de la IA para una experiencia. Nada se envía sin pulsar
 * el botón; cada propuesta se acepta (se marca la opción) o se descarta, y lleva
 * "Sugerido por IA". Nunca se enseña texto escrito por la IA: solo opciones de las listas.
 */
function ExperienceSuggestionsBox({ experience, suggestions }: { experience: ExperienceDto; suggestions: ExperienceSuggestions }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "warning" | "loading" | "done">("idle");
  const [items, setItems] = useState<{ kind: SuggestionKind; key: string }[]>([]);
  const [hadAny, setHadAny] = useState(false);
  const labelOf = (item: { kind: SuggestionKind; key: string }) => t(item.kind === "helps" ? `experiencias.${item.key}` : `situaciones.${item.key}`);

  async function ask(confirmed = false) {
    // RF-45 v1.4: con insultos o palabras ofensivas, antes de enviar nada se avisa y decide el usuario.
    if (!confirmed && hasOffensiveTerms(experience.text)) {
      setStatus("warning");
      return;
    }
    setStatus("loading");
    const result = await suggestions.onSuggest(experience);
    const found = result ? [...result.helps.map((key) => ({ kind: "helps" as const, key })), ...result.difficulties.map((key) => ({ kind: "difficulties" as const, key }))] : [];
    setItems(found);
    setHadAny(found.length > 0);
    setStatus("done");
  }

  const remove = (item: { kind: SuggestionKind; key: string }) => setItems((current) => current.filter((other) => other !== item));

  if (status === "idle") {
    return (
      <Button size="small" startIcon={<AutoAwesomeOutlinedIcon fontSize="small" />} onClick={() => void ask()} sx={{ mt: 0.5, textTransform: "none", px: 0.5 }}>
        {t("entrevista.sugerirConIa")}
      </Button>
    );
  }
  if (status === "warning") {
    return (
      <Box sx={{ mt: 0.75, p: 1, borderRadius: 2, bgcolor: "#FFF8E5" }}>
        <Typography variant="caption" component="p">
          {t("entrevista.avisoOfensivo")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          <Button size="small" onClick={() => void ask(true)} sx={{ textTransform: "none" }}>
            {t("entrevista.enviarIgualmente")}
          </Button>
          <Button size="small" color="inherit" onClick={() => setStatus("idle")} sx={{ textTransform: "none" }}>
            {t("entrevista.cancelar")}
          </Button>
        </Box>
      </Box>
    );
  }
  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">
          {t("entrevista.sugiriendo")}
        </Typography>
      </Box>
    );
  }
  if (!hadAny) {
    return (
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
        {t("entrevista.sinSugerencias")}
      </Typography>
    );
  }
  if (items.length === 0) return null;
  return (
    <Box sx={{ mt: 0.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {t("entrevista.iaSugiere")}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 14 }} />
          {t("entrevista.sugeridoPorIa")}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
        {items.map((item) => (
          <Box key={`${item.kind}:${item.key}`} sx={{ display: "inline-flex", alignItems: "center", border: "1px dashed", borderColor: "primary.light", borderRadius: 999, pl: 0.5 }}>
            <Button
              size="small"
              aria-label={t("entrevista.aceptarSugerencia", { opcion: labelOf(item) })}
              onClick={() => {
                suggestions.onAccept(item.kind, item.key);
                remove(item);
              }}
              sx={{ textTransform: "none", borderRadius: 999, py: 0 }}
            >
              {labelOf(item)}
            </Button>
            <IconButton size="small" aria-label={t("entrevista.descartarSugerencia", { opcion: labelOf(item) })} onClick={() => remove(item)}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * RF-44: el diario de experiencias de una categoría. Privadas: solo las ve el
 * usuario y nunca van a la IA. Tienen su propio "Añadir" (sin puntuar) y se
 * pueden borrar; se ven las más recientes y "Ver todas". El texto que se escribe
 * vive aquí: escribir solo vuelve a pintar este campo, no la entrevista entera.
 */
export function ExperienceJournal({ experiences, statusText, justAddedId, onAdd, onDelete, suggestions, suggestionsHint = false }: ExperienceJournalProps) {
  const { t, i18n } = useTranslation();
  const listLabelId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ExperienceDto | null>(null);
  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });
  const visible = showAll ? experiences : experiences.slice(0, VISIBLE_EXPERIENCES);
  const title = experiences.length > 0 ? t("entrevista.experienciasTituloN", { count: experiences.length }) : t("entrevista.experienciasTitulo");

  function clearAndClose() {
    setText("");
    setOpen(false);
  }

  async function add() {
    setAdding(true);
    const saved = await onAdd(text.trim());
    setAdding(false);
    if (saved) setText("");
  }

  return (
    <Box sx={{ mt: 0.5 }}>
      <ToggleRow icon={<EditNoteOutlinedIcon />} open={open} onToggle={() => setOpen((current) => !current)} statusText={statusText}>
        <Box component="span" id={listLabelId}>
          {title}
        </Box>
      </ToggleRow>
      {open && (
        <Box sx={{ mt: 1.5 }}>
          <TextField
            label={t("entrevista.nuevaExperiencia")}
            value={text}
            onChange={(event) => setText(event.target.value)}
            helperText={suggestions ? t("entrevista.experienciasPrivadasConIa") : t("entrevista.experienciasPrivadas")}
            multiline
            minRows={2}
            slotProps={{
              htmlInput: { maxLength: MAX_LENGTH },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <IconButton size="small" edge="end" aria-label={t("entrevista.borrarYCerrar")} onClick={clearAndClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            size="small"
            fullWidth
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button variant="contained" size="small" disabled={text.trim().length === 0 || adding} onClick={() => void add()}>
              {t("entrevista.anadir")}
            </Button>
          </Box>
        </Box>
      )}
      {experiences.length > 0 && (
        <Box component="ul" aria-labelledby={listLabelId} sx={{ listStyle: "none", m: 0, mt: 1, p: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {visible.map((experience) => (
            <Box
              component="li"
              key={experience.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.5,
                p: 1,
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.7)",
                ...(experience.id === justAddedId && { animation: `${appear} 360ms ease-out both` }),
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" component="p">
                  {formatDate(experience.createdAt)}
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere", whiteSpace: "pre-line" }}>
                  {experience.text}
                </Typography>
                {suggestions && <ExperienceSuggestionsBox experience={experience} suggestions={suggestions} />}
              </Box>
              <IconButton size="small" aria-label={t("entrevista.borrarExperiencia", { fecha: formatDate(experience.createdAt) })} onClick={() => setPendingDelete(experience)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      {suggestions && experiences.length > 0 && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
          {t("entrevista.sugerirAviso")}
        </Typography>
      )}
      {!suggestions && suggestionsHint && experiences.length > 0 && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
          {t("entrevista.sugerenciasPista")}{" "}
          <Link component={RouterLink} to="/perfil/datos">
            {t("entrevista.sugerenciasPistaEnlace")}
          </Link>
        </Typography>
      )}
      {experiences.length > VISIBLE_EXPERIENCES && (
        <Button size="small" onClick={() => setShowAll((current) => !current)} sx={{ mt: 0.5 }}>
          {showAll ? t("entrevista.verMenos") : t("entrevista.verTodas", { count: experiences.length })}
        </Button>
      )}
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)} aria-labelledby={`${listLabelId}-borrar`}>
        <DialogTitle id={`${listLabelId}-borrar`}>{t("entrevista.borrarExperienciaTitulo")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("entrevista.borrarExperienciaTexto")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>{t("entrevista.cancelar")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (pendingDelete) onDelete(pendingDelete);
              setPendingDelete(null);
            }}
          >
            {t("entrevista.borrar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
