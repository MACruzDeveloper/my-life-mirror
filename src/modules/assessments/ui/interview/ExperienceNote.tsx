import { memo, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { useTranslation } from "react-i18next";
import { ExpandToggle } from "./ExpandToggle";

interface ExperienceNoteProps {
  categoryId: string;
  /** Se llama en cada cambio con el texto completo; la pregunta lo guarda sin volver a pintarse. */
  onChange: (categoryId: string, text: string) => void;
}

/**
 * "Tu experiencia (privada)" de una categoría (RF-11/RF-41). Guarda el texto en
 * su propio estado: escribir solo vuelve a pintar este campo, no la entrevista
 * entera (con todas las categorías abiertas, cada tecla tardaba ~170 ms en un
 * móvil medio, ~1 s por palabra). La pregunta solo se entera de si el campo
 * tiene texto o no (lo que decide si su "Guardar" se habilita). El título lo
 * abre y lo cierra (lo escrito se conserva); la X lo borra y vuelve al principio.
 */
export const ExperienceNote = memo(function ExperienceNote({ categoryId, onChange }: ExperienceNoteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function clearAndClose() {
    setText("");
    onChange(categoryId, "");
    setOpen(false);
  }

  return (
    <Box sx={{ mt: 0.5 }}>
      <ExpandToggle icon={<EditNoteOutlinedIcon />} open={open} onToggle={() => setOpen((current) => !current)}>
        {t("entrevista.anadirNota")}
      </ExpandToggle>
      {open && (
        <TextField
          label={t("entrevista.nota")}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onChange(categoryId, event.target.value);
          }}
          helperText={t("entrevista.notaPrivada")}
          slotProps={{
            htmlInput: { maxLength: 500 },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" aria-label={t("entrevista.borrarYCerrar")} onClick={clearAndClose}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
        />
      )}
    </Box>
  );
});
