import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Navigate, Link as RouterLink } from "react-router";
import { isRecoveryHash } from "@modules/accounts/ui/extractTokenFromHash";
import { HowItWorks } from "@shared/ui/components/HowItWorks";
import { HelpFooter } from "@shared/ui/components/HelpLink";
import { PALETTE } from "@shared/ui/theme";
import { FixedBackdrop } from "@shared/ui/components/FixedBackdrop";
import heroDesktop from "../assets/backgrounds/portada-a-1672.webp";
import heroMobile from "../assets/backgrounds/portada-a-828.webp";
import secondDesktop from "../assets/backgrounds/portada-b-1672.webp";
import secondMobile from "../assets/backgrounds/portada-b-828.webp";

/**
 * La capa oscura sobre las imágenes: ligera arriba, donde están las figuras, y más densa
 * abajo, donde va el texto. Es lo único que hace legible el texto blanco (sin sombras, por
 * decisión del autor): si se aclara, hay que volver a medir el contraste en la zona más
 * clara de la imagen, que es la ropa blanca.
 */
const OVERLAY = "linear-gradient(rgba(8, 14, 20, 0.18) 0%, rgba(8, 14, 20, 0.3) 45%, rgba(8, 14, 20, 0.72) 100%)";

/** RF-39. Página pública — sin lógica de dominio, solo introducción + CTAs sobre la imagen de portada (UX-08), y cómo funciona (UX-01). */
export function Landing() {
  const { t } = useTranslation();

  // La portada se recorre con la flecha, la rueda, el dedo o el teclado, pero sin barra a la vista
  // (decisión del autor). Solo aquí: al salir de la portada vuelve.
  useEffect(() => {
    document.documentElement.classList.add("mlm-no-scrollbar");
    return () => document.documentElement.classList.remove("mlm-no-scrollbar");
  }, []);

  // RF-38: un enlace de recuperación que acaba aquí sigue hasta su pantalla, con su token (o su error).
  if (isRecoveryHash(window.location.hash)) {
    return <Navigate to={{ pathname: "/restablecer-password", hash: window.location.hash }} replace />;
  }

  return (
    <>
      {/* UX-08: primera vista a pantalla completa. La imagen es decorativa (no se anuncia). */}
      <Box component="section" aria-labelledby="landing-title" sx={[SECTION, { height: "100svh", alignItems: "flex-end", pb: { xs: 5, sm: 6 }, color: "common.white", textAlign: "center" }]}>
        <FixedBackdrop mobile={heroMobile} desktop={heroDesktop} overlay={OVERLAY} fallbackColor={PALETTE.ink} />
        <Box sx={{ maxWidth: 560 }}>
          <Typography id="landing-title" variant="h3" component="h1" gutterBottom>
            {t("landing.titulo")}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t("landing.descripcion")}
          </Typography>
          {/* Botones en colores de la paleta que no compiten con la imagen: azul noche el principal, gris azulado el otro. */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
            <Button component={RouterLink} to="/registro" variant="contained" sx={{ bgcolor: PALETTE.navy, color: PALETTE.mist, border: "1px solid rgba(242, 242, 242, 0.28)", "&:hover": { bgcolor: "#21445A" } }}>
              {t("landing.crearCuenta")}
            </Button>
            <Button component={RouterLink} to="/login" variant="contained" sx={{ bgcolor: "rgba(114, 130, 140, 0.55)", color: PALETTE.mist, border: "1px solid rgba(242, 242, 242, 0.28)", boxShadow: "none", "&:hover": { bgcolor: "rgba(114, 130, 140, 0.75)", boxShadow: "none" } }}>
              {t("landing.iniciarSesion")}
            </Button>
          </Stack>
          {/* La flecha lleva a la parte siguiente. Es un enlace: funciona con el teclado y sin JavaScript. */}
          <IconButton
            component="a"
            href={`#${HOW_IT_WORKS_ID}`}
            aria-label={t("landing.verComoFunciona")}
            onClick={scrollToHowItWorks}
            sx={{ mt: { xs: 2.5, sm: 3 }, color: "common.white", border: "1px solid rgba(255, 255, 255, 0.85)", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
        <AiNote />
      </Box>
      {/* Al bajar, esta parte sube sobre su propia imagen, que no se mueve: la primera queda tapada como por una cortina. */}
      <Box id={HOW_IT_WORKS_ID} sx={[SECTION, { minHeight: "100svh", alignItems: "flex-end", py: { xs: 6, sm: 8 } }]}>
        <FixedBackdrop mobile={secondMobile} desktop={secondDesktop} overlay={OVERLAY} fallbackColor={PALETTE.ink} />
        <Box className="mlm-landing-card" sx={{ width: "100%", maxWidth: 520, bgcolor: "rgba(255, 255, 255, 0.93)", backdropFilter: "blur(6px)", borderRadius: 3, px: { xs: 2.5, sm: 4 }, pt: { xs: 3, sm: 4 }, pb: 1 }}>
          <HowItWorks />
          <HelpFooter />
        </Box>
        <AiNote />
      </Box>
    </>
  );
}

const HOW_IT_WORKS_ID = "como-funciona";

/** Baja con suavidad a la segunda parte; quien pide menos movimiento salta directamente. */
function scrollToHowItWorks(event: React.MouseEvent) {
  const target = document.getElementById(HOW_IT_WORKS_ID);
  if (!target) return;
  event.preventDefault();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

/** Lo común a las dos partes: ocupan el ancho, centran su contenido y recortan su fondo fijo. */
const SECTION = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  width: "100%",
  maxWidth: "100%",
  px: 2,
  // El fondo es `position: fixed`; `clip-path` lo recorta a esta parte. Es lo que da el efecto
  // de que el contenido se desliza sobre imágenes quietas, también en iOS, donde
  // `background-attachment: fixed` no funciona.
  clipPath: "inset(0)",
} as const;

function AiNote() {
  const { t } = useTranslation();
  return (
    <Typography variant="caption" sx={{ position: "absolute", right: 12, bottom: 8, color: "common.white", opacity: 0.75 }}>
      {t("landing.imagenIA")}
    </Typography>
  );
}
