import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { AdminCategories } from "./AdminCategories";

interface UserDto {
  id: string;
  email: string;
  rol: string;
  createdAt: string;
  lastSignInAt?: string;
}

type Estado = { tipo: "cargando" } | { tipo: "listo"; usuarios: UserDto[] } | { tipo: "sinPermiso" } | { tipo: "error" };

/**
 * Panel de administración (ADM-01), primer corte: usuarios registrados. Esta
 * pantalla no es la barrera de seguridad — solo refleja lo que responde la
 * API: un 403 no muestra datos. La protección real vive en el servidor.
 */
export function AdminPage() {
  const { t, i18n } = useTranslation();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [pestana, setPestana] = useState<"usuarios" | "categorias">("usuarios");

  useEffect(() => {
    let cancelado = false;

    fetch("/api/admin/users")
      .then(async (respuesta) => {
        if (respuesta.status === 403) return { tipo: "sinPermiso" } as const;
        if (!respuesta.ok) throw new Error("fallo");
        return { tipo: "listo", usuarios: (await respuesta.json()) as UserDto[] } as const;
      })
      .then((nuevo) => {
        if (!cancelado) setEstado(nuevo);
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const fecha = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : t("admin.nunca"));

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", mt: 3, px: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("admin.titulo")}
      </Typography>
      <Tabs value={pestana} onChange={(_evento, valor: "usuarios" | "categorias") => setPestana(valor)} sx={{ mb: 2 }}>
        <Tab label={t("admin.pestanaUsuarios")} value="usuarios" />
        <Tab label={t("admin.pestanaCategorias")} value="categorias" />
      </Tabs>
      {pestana === "categorias" && <AdminCategories />}
      {pestana === "usuarios" && estado.tipo === "cargando" && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {pestana === "usuarios" && estado.tipo === "sinPermiso" && <Alert severity="warning">{t("admin.sinPermiso")}</Alert>}
      {pestana === "usuarios" && estado.tipo === "error" && <Alert severity="error">{t("admin.errorCarga")}</Alert>}
      {pestana === "usuarios" && estado.tipo === "listo" && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t("admin.usuarios")} · {t("admin.total", { count: estado.usuarios.length })}
          </Typography>
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("admin.email")}</TableCell>
                  <TableCell>{t("admin.rol")}</TableCell>
                  <TableCell>{t("admin.alta")}</TableCell>
                  <TableCell>{t("admin.ultimoAcceso")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estado.usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.rol}</TableCell>
                    <TableCell>{fecha(usuario.createdAt)}</TableCell>
                    <TableCell>{fecha(usuario.lastSignInAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
