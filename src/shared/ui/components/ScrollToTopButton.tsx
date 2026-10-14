import Fab from "@mui/material/Fab";
import Fade from "@mui/material/Fade";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useTranslation } from "react-i18next";
import { prefersReducedMotion } from "../motion";

/** Cuánto hay que bajar para que aparezca. */
const SHOW_AFTER_PX = 400;

/**
 * Botón flotante "Volver arriba", abajo a la izquierda (a la derecha quedan
 * los avisos emergentes). Aparece con un fundido al bajar por la página y
 * desaparece arriba del todo.
 */
export function ScrollToTopButton() {
  const { t } = useTranslation();
  const visible = useScrollTrigger({ disableHysteresis: true, threshold: SHOW_AFTER_PX });
  return (
    <Fade in={visible}>
      <Fab
        size="medium"
        color="primary"
        aria-label={t("comun.volverArriba")}
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
        sx={{ position: "fixed", left: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: (theme) => theme.zIndex.speedDial }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Fade>
  );
}
