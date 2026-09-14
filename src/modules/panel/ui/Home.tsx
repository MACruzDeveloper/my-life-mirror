import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSesion } from "@modules/cuentas/ui/useSesion";
import { Header } from "@shared/ui/Header";

/** Placeholder mínimo tras iniciar sesión (RF-39) — el panel real es RF-14, Sprint 4. */
export function Home() {
  const { t } = useTranslation();
  const { email } = useSesion();
  const navigate = useNavigate();

  async function cerrarSesion() {
    await fetch("/api/logout", { method: "POST" });
    navigate("/login", { replace: true });
  }

  return (
    <>
      <Header email={email} onCerrarSesion={cerrarSesion} />
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("panel.bienvenida")}
        </Typography>
        <Typography variant="body1">{t("panel.descripcion")}</Typography>
      </Box>
    </>
  );
}
