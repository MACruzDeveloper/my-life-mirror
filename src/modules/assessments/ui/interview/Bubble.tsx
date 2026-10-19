import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { BandBackground } from "../BandBackground";
import type { ScoreBand } from "../scoreBand";
import { PENDING_COLORS } from "./pendingColors";

/** Etiqueta pequeña "Sin responder". */
export function PendingBadge({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{ px: 1, py: 0.25, borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, bgcolor: PENDING_COLORS.bg, color: PENDING_COLORS.fg, whiteSpace: "nowrap" }}
    >
      {label}
    </Box>
  );
}

/**
 * Burbuja de conversación — el entrevistador a la izquierda, el usuario a la derecha. En móvil el avatar
 * va encima de su burbuja, para no quitarle ancho: la pregunta ocupa el 90 % y la respuesta, el 100 %.
 */
export function Bubble({ children, side, avatar, alt, band }: { children: React.ReactNode; side: "left" | "right"; avatar: string; alt: string; band?: ScoreBand }) {
  const isLeft = side === "left";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: isLeft ? "row" : "row-reverse" },
        alignItems: { xs: isLeft ? "flex-start" : "flex-end", sm: "flex-start" },
        gap: { xs: 1, sm: 1.5 },
      }}
    >
      <Avatar src={avatar} alt={alt} sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, flexShrink: 0 }} />
      <Box
        data-band={band}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: isLeft ? "#FFFFFF" : "#EDF0F2",
          border: "1px solid",
          borderColor: isLeft ? "#DCE3E7" : "#D5DBDF",
          borderRadius: isLeft ? "4px 20px 20px 20px" : "20px 4px 20px 20px",
          px: 2,
          py: 1.5,
          minWidth: 0,
          boxSizing: "border-box",
          width: { xs: isLeft ? "90%" : "100%", sm: "auto" },
          flex: { xs: "none", sm: isLeft ? "0 1 auto" : 1 },
        }}
      >
        <BandBackground band={band} />
        <Box sx={{ position: "relative" }}>{children}</Box>
      </Box>
    </Box>
  );
}
