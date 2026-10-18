import { useEffect, useRef, useState } from "react";
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
import { PresentationAudio } from "./PresentationAudio";
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
      <Box component="section" aria-labelledby="landing-title" sx={[SECTION, { height: "100svh", alignItems: "flex-end", pb: { xs: 2.5, sm: 3 }, color: "common.white", textAlign: "center" }]}>
        <FixedBackdrop mobile={heroMobile} desktop={heroDesktop} overlay={OVERLAY} fallbackColor={PALETTE.midnight} />
        <Box sx={{ maxWidth: 560 }}>
          <Typography id="landing-title" variant="h3" component="h1" gutterBottom>
            {t("landing.titulo")}
          </Typography>
          <Typography variant="body1">
            {t("landing.descripcion")}
          </Typography>
          {/* La presentación en audio: voz generada con IA, solo al pulsar. */}
          <PresentationAudio />
          {/* Después del audio, los botones: quien ya tiene cuenta entra desde aquí. Colores de la paleta que no compiten con la imagen. */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "center", mt: { xs: 2.5, sm: 3 } }}>
            <Button component={RouterLink} to="/registro" variant="contained" sx={{ bgcolor: PALETTE.richBlack, color: PALETTE.antiFlash, border: "1px solid rgba(243, 241, 244, 0.28)", "&:hover": { bgcolor: "#0E2523" } }}>
              {t("landing.crearCuenta")}
            </Button>
            <Button component={RouterLink} to="/login" variant="contained" sx={{ bgcolor: "rgba(107, 158, 168, 0.55)", color: PALETTE.antiFlash, border: "1px solid rgba(243, 241, 244, 0.28)", boxShadow: "none", "&:hover": { bgcolor: "rgba(107, 158, 168, 0.75)", boxShadow: "none" } }}>
              {t("landing.iniciarSesion")}
            </Button>
          </Stack>
          {/* La flecha lleva a la parte siguiente. Es un enlace: funciona con el teclado y sin JavaScript. */}
          <IconButton
            component="a"
            href={`#${HOW_IT_WORKS_ID}`}
            aria-label={t("landing.verComoFunciona")}
            onClick={scrollToHowItWorks}
            size="small"
            sx={{ mt: { xs: 2, sm: 2.5 }, color: "common.white", border: "1px solid rgba(255, 255, 255, 0.85)", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } }}
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      {/* Al bajar, esta parte sube sobre su propia imagen, que no se mueve: la primera queda tapada como por una cortina. */}
      <Box id={HOW_IT_WORKS_ID} sx={[SECTION, { minHeight: "100svh", alignItems: "flex-end", py: { xs: 6, sm: 8 } }]}>
        <FixedBackdrop mobile={secondMobile} desktop={secondDesktop} overlay={OVERLAY} fallbackColor={PALETTE.midnight} />
        <HowItWorksCard />
      </Box>
      {/* Uno solo para las dos imágenes, fijo en la esquina: no se repite en cada parte. */}
      <AiNote />
    </>
  );
}

const HOW_IT_WORKS_ID = "como-funciona";

/**
 * "Cómo funciona", en una tarjeta más pequeña que deja ver la imagen. En escritorio, cuando la
 * segunda pantalla ya está casi entera a la vista, se desliza despacio del centro a la izquierda
 * (una vez; sin animación si se pide menos movimiento). En móvil, centrada: no hay sitio a los lados.
 */
function HowItWorksCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    // Se vigila la segunda pantalla entera, no la tarjeta: el movimiento empieza cuando ya se ha
    // llegado (casi toda a la vista) y no mientras se baja, que es cuando no se ve.
    const screen = cardRef.current?.parentElement;
    if (!screen || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setDocked(true);
        observer.disconnect();
      },
      { threshold: 0.85 },
    );
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={cardRef}
      className="mlm-landing-card"
      data-docked={docked}
      sx={{
        width: "100%",
        maxWidth: 420,
        bgcolor: "rgba(255, 255, 255, 0.93)",
        backdropFilter: "blur(6px)",
        borderRadius: 3,
        px: { xs: 2.5, sm: 3 },
        pt: { xs: 2.5, sm: 3 },
        pb: 1,
        "& .MuiTypography-body1": { fontSize: "0.92rem" },
        // Del centro al borde izquierdo (a 4rem): media pantalla menos media tarjeta menos el margen.
        transform: { md: docked ? "translateX(calc(-1 * (50vw - 50% - 4rem)))" : "none" },
        // Despacio y con una pausa breve al principio, para que se vea el desplazamiento entero.
        transition: "transform 1400ms ease-in-out 250ms",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      <HowItWorks />
      <HelpFooter />
    </Box>
  );
}

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
    <Typography variant="caption" sx={{ position: "fixed", right: 12, bottom: 8, zIndex: 2, color: "common.white", opacity: 0.75, pointerEvents: "none" }}>
      {t("landing.imagenIA")}
    </Typography>
  );
}
