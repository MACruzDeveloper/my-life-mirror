import { useId } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

/**
 * UX-01. "Cómo funciona" en tres pasos numerados. Lo usan la portada (antes de
 * tener cuenta) y la bienvenida de Inicio (justo después de registrarse): los
 * dos momentos en los que la validación mostró que hacía falta explicarlo.
 */
export function HowItWorks() {
  const { t } = useTranslation();
  const headingId = useId();
  const steps = t("guia.pasos", { returnObjects: true }) as string[];

  return (
    <Box component="section" aria-labelledby={headingId} sx={{ textAlign: "left" }}>
      <Typography id={headingId} variant="h6" component="h2" sx={{ mb: 1.5, textAlign: "center" }}>
        {t("guia.comoFunciona")}
      </Typography>
      <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {steps.map((step, index) => (
          <Box component="li" key={step} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {index + 1}
            </Box>
            <Typography variant="body1" sx={{ pt: 0.25 }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
