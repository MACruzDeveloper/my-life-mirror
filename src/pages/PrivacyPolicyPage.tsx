import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { CURRENT_POLICY_VERSION } from "@modules/consent/domain/CurrentPolicy";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";

/**
 * RGPD (RNF-05): página pública, enlazada desde el modal de consentimiento
 * (RF-04/RF-07) — antes de esto, se pedía consentimiento sin nada que leer.
 * Contenido de borrador razonable para un TFM, no redactado por asesoría
 * legal — dejarlo así de explícito si algún día se usa fuera de ese
 * contexto. La versión mostrada coincide con `VERSION_POLITICA_ACTUAL`, la
 * misma que valida el backend (api/grant-consent.ts, api/activate-category.ts).
 */
export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <>
      <Breadcrumbs
        items={[{ label: t("breadcrumbs.inicio"), path: "/" }, { label: t("breadcrumbs.politicaPrivacidad") }]}
      />
      <Box sx={{ maxWidth: { xs: "100%", sm: 640 }, mx: "auto", mt: 2, px: 2, pb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("politicaPrivacidad.titulo")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("politicaPrivacidad.version", { version: CURRENT_POLICY_VERSION })}
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t("politicaPrivacidad.queDatosTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("politicaPrivacidad.queDatosTexto")}
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t("politicaPrivacidad.datosSensiblesTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("politicaPrivacidad.datosSensiblesTexto")}
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t("politicaPrivacidad.paraQueTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("politicaPrivacidad.paraQueTexto")}
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t("politicaPrivacidad.tusDerechosTitulo")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t("politicaPrivacidad.tusDerechosTexto")}
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t("politicaPrivacidad.contactoTitulo")}
        </Typography>
        <Typography variant="body1">{t("politicaPrivacidad.contactoTexto")}</Typography>
      </Box>
    </>
  );
}
