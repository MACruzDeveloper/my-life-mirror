import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { AdminAudit } from "./AdminAudit";
import { AdminCategories } from "./AdminCategories";
import { AdminUsers } from "./AdminUsers";
import { AdminVideos } from "./AdminVideos";

type AdminTab = "usuarios" | "categorias" | "videos" | "auditoria";

/**
 * Panel de administración (ADM-01/02/03/04): usuarios, catálogo de categorías,
 * vídeos de inspiración y auditoría. Esta pantalla no es la barrera de seguridad — solo refleja lo
 * que responde la API: un 403 no muestra datos. La protección real vive en el
 * servidor (sesión + rol en cada caso de uso + contraseña en lo sensible).
 */
export function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AdminTab>("usuarios");

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("admin.titulo")}
      </Typography>
      {/* Mismo estilo que las pestañas de la ventana de ideas: subrayado de la marca y fondo suave en la elegida. */}
      <Tabs
        value={tab}
        onChange={(_evento, value: AdminTab) => setTab(value)}
        variant="scrollable"
        sx={{
          mb: 3,
          minHeight: 48,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": { height: 3, bgcolor: "primary.main" },
          "& .MuiTab-root": { minHeight: 48, px: 2.5, textTransform: "none", fontSize: "0.95rem", lineHeight: 1.3, color: "text.secondary" },
          "& .MuiTab-root.Mui-selected": { color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
        }}
      >
        <Tab label={t("admin.pestanaUsuarios")} value="usuarios" />
        <Tab label={t("admin.pestanaCategorias")} value="categorias" />
        <Tab label={t("admin.pestanaVideos")} value="videos" />
        <Tab label={t("admin.pestanaAuditoria")} value="auditoria" />
      </Tabs>
      {tab === "usuarios" && <AdminUsers />}
      {tab === "categorias" && <AdminCategories />}
      {tab === "videos" && <AdminVideos />}
      {tab === "auditoria" && <AdminAudit />}
    </Box>
  );
}
