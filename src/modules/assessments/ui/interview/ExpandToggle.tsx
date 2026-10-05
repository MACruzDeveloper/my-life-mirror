import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ExpandToggleProps {
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** En móvil, la confirmación de guardado sustituye un momento al texto (no cabe al lado). Solo visual: el aviso va fuera. */
  status?: ReactNode;
}

/**
 * Título desplegable de una pregunta ("¿Qué te ayuda?", "¿Qué te lo pone difícil?",
 * "Tu experiencia"): icono, texto y una flecha que gira al abrirse, con fondo suave,
 * para que se vea que son tres opciones que se pueden tocar.
 */
export function ExpandToggle({ icon, open, onToggle, children, status }: ExpandToggleProps) {
  return (
    <Button
      size="small"
      startIcon={icon}
      endIcon={<ExpandMoreIcon sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />}
      aria-expanded={open}
      onClick={onToggle}
      sx={{
        textTransform: "none",
        flexShrink: 0,
        whiteSpace: "nowrap",
        fontWeight: 600,
        borderRadius: 999,
        px: 1.25,
        bgcolor: "rgba(255, 255, 255, 0.7)",
        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.95)" },
      }}
    >
      {status ? (
        <>
          {/* El título sigue siendo el nombre del botón para el lector de pantalla; la confirmación es solo visual. */}
          <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
            {children}
          </Box>
          {status}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
