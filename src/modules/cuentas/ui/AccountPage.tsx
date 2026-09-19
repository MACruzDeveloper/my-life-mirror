import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";

const RUTA_PERFIL = "/perfil";
const RUTA_CATEGORIAS = "/perfil/categorias";

/**
 * Envoltura con pestañas para toda la gestión de cuenta (RF-03, RF-06/RF-07)
 * — antes eran dos enlaces sueltos en el Header ("Perfil", "Categorías");
 * se consolidan aquí porque esta página seguirá creciendo (notificaciones,
 * exportar/eliminar datos...). Rutas anidadas de verdad (no una pestaña por
 * estado local) para que cada una sea recargable/enlazable directamente.
 */
export function AccountPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const pestanaActiva = location.pathname === RUTA_CATEGORIAS ? RUTA_CATEGORIAS : RUTA_PERFIL;

  return (
    <Box sx={{ maxWidth: { xs: "100%", sm: 560 }, mx: "auto", mt: 2, px: 2 }}>
      <Tabs value={pestanaActiva} onChange={(_evento, valor: string) => navigate(valor)} variant="fullWidth">
        <Tab label={t("breadcrumbs.perfil")} value={RUTA_PERFIL} />
        <Tab label={t("breadcrumbs.categorias")} value={RUTA_CATEGORIAS} />
      </Tabs>
      <Outlet />
    </Box>
  );
}
