import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { PENDING_COLORS } from "./pendingColors";

export interface QuestionsBarItem {
  id: string;
  name: string;
  isUnanswered: boolean;
}

interface QuestionsBarProps {
  items: QuestionsBarItem[];
  unsavedCount: number;
  saving: boolean;
  error: string | null;
  onGoTo: (categoryId: string) => void;
  onSaveAll: () => void;
  /** Versión fija bajo la cabecera al bajar (UX-12): píldoras y botón más pequeños. */
  compact?: boolean;
}

/**
 * UX-12: los accesos a cada pregunta y "Guardar todo". En móvil los accesos se desplazan en horizontal
 * y el botón queda a la derecha; en escritorio, los accesos pasan a varias líneas (solo en la normal:
 * la compacta se queda en una, para ocupar poco).
 */
export function QuestionsBar({ items, unsavedCount, saving, error, onGoTo, onSaveAll, compact = false }: QuestionsBarProps) {
  const { t } = useTranslation();
  return (
    // La compacta, centrada: el grupo de accesos no se estira (sigue desplazándose si no cabe, sin cortarse).
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: compact ? "center" : undefined, gap: compact ? 1 : 1.5 }}>
      <Box
        component="nav"
        aria-label={t("entrevista.irA")}
        sx={{
          flex: compact ? "0 1 auto" : 1,
          minWidth: 0,
          display: "flex",
          flexWrap: compact ? "nowrap" : { xs: "nowrap", md: "wrap" },
          overflowX: compact ? "auto" : { xs: "auto", md: "visible" },
          gap: compact ? 0.75 : 1,
          pb: compact ? 0 : { xs: 0.5, md: 0 },
          scrollbarWidth: compact ? "none" : undefined,
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            component="a"
            href={`#pregunta-${item.id}`}
            onClick={(event: React.MouseEvent) => {
              event.preventDefault();
              onGoTo(item.id);
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: compact ? 1 : 1.5,
              py: compact ? 0.25 : 0.5,
              borderRadius: 999,
              border: "1px solid",
              borderColor: item.isUnanswered ? PENDING_COLORS.border : "#D5DBDF",
              bgcolor: item.isUnanswered ? PENDING_COLORS.bg : "#FFFFFF",
              color: item.isUnanswered ? PENDING_COLORS.fg : "text.primary",
              fontSize: compact ? "0.75rem" : "0.875rem",
              textDecoration: "none",
              // En una línea: en móvil la barra se desplaza en horizontal, no parte las píldoras.
              whiteSpace: "nowrap",
              flexShrink: 0,
              "&:hover, &:focus-visible": { borderColor: item.isUnanswered ? PENDING_COLORS.fg : "text.secondary" },
            }}
          >
            {item.name}
            {item.isUnanswered && (
              <Box component="span" sx={{ fontSize: compact ? "0.6875rem" : "0.75rem", fontWeight: 600 }}>
                · {t("entrevista.sinResponder")}
              </Box>
            )}
          </Box>
        ))}
      </Box>
      <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Button
          variant="contained"
          color="secondary"
          size={compact ? "small" : "medium"}
          onClick={onSaveAll}
          disabled={unsavedCount === 0 || saving}
          aria-label={t("entrevista.guardarTodoConCuenta", { count: unsavedCount })}
        >
          {saving ? t("entrevista.guardandoTodo") : t("entrevista.guardarTodoConCuenta", { count: unsavedCount })}
        </Button>
        {error && (
          <Typography variant="caption" color="error" role="alert" sx={{ mt: 0.5, maxWidth: 220, textAlign: "right" }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
