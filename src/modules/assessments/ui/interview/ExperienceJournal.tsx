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
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { useTranslation } from "react-i18next";
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
}

/**
 * RF-44: el diario de experiencias de una categoría. Privadas: solo las ve el
 * usuario y nunca van a la IA. Tienen su propio "Añadir" (sin puntuar) y se
 * pueden borrar; se ven las más recientes y "Ver todas". El texto que se escribe
 * vive aquí: escribir solo vuelve a pintar este campo, no la entrevista entera.
 */
export function ExperienceJournal({ experiences, statusText, justAddedId, onAdd, onDelete }: ExperienceJournalProps) {
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
            helperText={t("entrevista.experienciasPrivadas")}
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
              </Box>
              <IconButton size="small" aria-label={t("entrevista.borrarExperiencia", { fecha: formatDate(experience.createdAt) })} onClick={() => setPendingDelete(experience)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
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
