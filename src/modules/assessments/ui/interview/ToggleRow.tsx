import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { ExpandToggle } from "./ExpandToggle";

/** Oculto a la vista pero leído por el lector de pantalla. */
const VISUALLY_HIDDEN = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

interface ToggleRowProps {
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** "✓ …" tras guardar algo de esta lista (se borra solo, lo decide quien lo pinta). */
  statusText?: string | null;
}

/**
 * Título desplegable de una pregunta y, en su misma fila, su "✓ …" (RF-42): al
 * irse no hace saltar nada. En pantallas anchas va a la derecha; en móvil no cabe
 * y se ve un momento dentro del propio título. El aviso para el lector de
 * pantalla es siempre el mismo, fuera del botón.
 */
export function ToggleRow({ icon, open, onToggle, children, statusText }: ToggleRowProps) {
  const isWide = useMediaQuery(useTheme().breakpoints.up("sm"), { noSsr: true });
  const inline = statusText && !isWide ? (
    <Box component="span" aria-hidden sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "success.dark" }}>
      <CheckCircleOutlineIcon fontSize="small" />
      {statusText}
    </Box>
  ) : undefined;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <ExpandToggle icon={icon} open={open} onToggle={onToggle} status={inline}>
        {children}
      </ExpandToggle>
      {statusText && (
        <Typography role="status" variant="body2" sx={isWide ? { display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, color: "success.dark" } : VISUALLY_HIDDEN}>
          {isWide && <CheckCircleOutlineIcon fontSize="small" sx={{ flexShrink: 0 }} />}
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {statusText}
          </Box>
        </Typography>
      )}
    </Box>
  );
}
