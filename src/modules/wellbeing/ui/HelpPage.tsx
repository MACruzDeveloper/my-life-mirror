import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@shared/ui/components/Breadcrumbs";
import { ProtectedLayout } from "@shared/ui/components/ProtectedLayout";
import { PublicLayout } from "@shared/ui/components/PublicLayout";
import { SessionProvider, useSession } from "@shared/ui/context/SessionContext";
import { getCrisisHelplines } from "../application/getCrisisHelplines";

/**
 * RF-30: "¿Necesitas ayuda ahora?". Pública (con y sin sesión) y estática: no
 * llama a la API. España con sus líneas y, para el resto, el directorio
 * internacional; no se elige país ni se deduce de nada.
 */
export function HelpPage() {
  const { t } = useTranslation();
  const spain = getCrisisHelplines("ES");
  const [international] = getCrisisHelplines("INTL");

  return (
    <Box component="main" sx={{ maxWidth: 560, mx: "auto", px: 2, py: { xs: 2, sm: 4 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="h4" component="h1">
        {t("ayuda.titulo")}
      </Typography>
      <Typography variant="body1">{t("ayuda.intro")}</Typography>

      <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="h6" component="h2">
          {t("ayuda.espana")}
        </Typography>
        {spain.map((line) => (
          <Box key={line.key} sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600 }}>
                {t(`ayuda.lineas.${line.key}.nombre`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(`ayuda.lineas.${line.key}.disponibilidad`)}
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<PhoneOutlinedIcon />} href={`tel:${line.phone}`} aria-label={t("ayuda.llamar", { telefono: line.phone })} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
              {line.phone}
            </Button>
          </Box>
        ))}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t("ayuda.peligro")}
        </Typography>
      </Box>

      {international && (
        <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h6" component="h2">
            {t("ayuda.fueraEspana")}
          </Typography>
          <Typography variant="body2">
            <Link href={international.url} target="_blank" rel="noopener noreferrer">
              {t(`ayuda.lineas.${international.key}.nombre`)}
            </Link>
            {" — "}
            {t(`ayuda.lineas.${international.key}.disponibilidad`)}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" component="p">
        {t("ayuda.aviso")}
      </Typography>
    </Box>
  );
}

/** Con sesión, la cabecera de la app; sin ella, la de las páginas públicas. El contenido no espera a saberlo. */
function HelpLayout() {
  const { t } = useTranslation();
  const { loading, authenticated } = useSession();
  if (loading) return <HelpPage />;
  if (authenticated) {
    return (
      <ProtectedLayout breadcrumbs={[{ label: t("breadcrumbs.inicio"), path: "/inicio" }, { label: t("breadcrumbs.ayuda") }]}>
        <HelpPage />
      </ProtectedLayout>
    );
  }
  return (
    <PublicLayout>
      <Breadcrumbs items={[{ label: t("breadcrumbs.inicio"), path: "/" }, { label: t("breadcrumbs.ayuda") }]} align="start" />
      <HelpPage />
    </PublicLayout>
  );
}

/** Ruta `/ayuda`: pública, pero con la cabecera que toca según haya sesión, para poder salir de ella. */
export function HelpRoute() {
  return (
    <SessionProvider>
      <HelpLayout />
    </SessionProvider>
  );
}
