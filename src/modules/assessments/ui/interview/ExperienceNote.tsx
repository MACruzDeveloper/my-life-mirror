import { memo, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useTranslation } from "react-i18next";

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
 * tiene texto o no (lo que decide si su "Guardar" se habilita).
 */
export const ExperienceNote = memo(function ExperienceNote({ categoryId, onChange }: ExperienceNoteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <Button size="small" onClick={() => setOpen(true)} sx={{ mt: 0.5 }}>
        {t("entrevista.anadirNota")}
      </Button>
    );
  }

  return (
    <TextField
      label={t("entrevista.nota")}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onChange(categoryId, event.target.value);
      }}
      helperText={t("entrevista.notaPrivada")}
      slotProps={{ htmlInput: { maxLength: 500 } }}
      size="small"
      fullWidth
      sx={{ mt: 1.5 }}
    />
  );
});
