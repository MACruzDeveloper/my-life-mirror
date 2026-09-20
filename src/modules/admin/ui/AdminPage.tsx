import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { AdminAudit } from "./AdminAudit";
import { AdminCategories } from "./AdminCategories";
import { AdminUsers } from "./AdminUsers";

type Pestana = "usuarios" | "categorias" | "auditoria";

/**
 * Panel de administración (ADM-01/02/03): usuarios, catálogo de categorías y
 * auditoría. Esta pantalla no es la barrera de seguridad — solo refleja lo
 * que responde la API: un 403 no muestra datos. La protección real vive en el
 * servidor (sesión + rol en cada caso de uso + contraseña en lo sensible).
 */
export function AdminPage() {
  const { t } = useTranslation();
  const [pestana, setPestana] = useState<Pestana>("usuarios");

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3, px: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("admin.titulo")}
      </Typography>
      <Tabs value={pestana} onChange={(_evento, valor: Pestana) => setPestana(valor)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab label={t("admin.pestanaUsuarios")} value="usuarios" />
        <Tab label={t("admin.pestanaCategorias")} value="categorias" />
        <Tab label={t("admin.pestanaAuditoria")} value="auditoria" />
      </Tabs>
      {pestana === "usuarios" && <AdminUsers />}
      {pestana === "categorias" && <AdminCategories />}
      {pestana === "auditoria" && <AdminAudit />}
    </Box>
  );
}
