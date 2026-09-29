import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { HttpError } from "@shared/ui/api/getJson";
import { useAdminAudit, useAdminUsers } from "./adminQueries";

/**
 * Registro de auditoría (ADM-03): quién hizo qué y cuándo. Los ids se muestran
 * como el email de la cuenta si todavía existe; si se eliminó, solo el id
 * abreviado (por diseño la auditoría no guarda emails).
 */
export function AdminAudit() {
  const { t, i18n } = useTranslation();
  const auditoria = useAdminAudit();
  const usuarios = useAdminUsers();
  const emails = new Map((usuarios.data ?? []).map((u) => [u.id, u.email]));
  const quien = (id?: string) => (id ? (emails.get(id) ?? id.slice(0, 8)) : "—");

  if (auditoria.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (auditoria.error instanceof HttpError && auditoria.error.status === 403) return <Alert severity="warning">{t("admin.sinPermiso")}</Alert>;
  if (auditoria.isError) return <Alert severity="error">{t("admin.errorCarga")}</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {t("admin.auditoriaAyuda")}
      </Typography>
      {auditoria.data.length === 0 ? (
        <Typography>{t("admin.auditoriaVacia")}</Typography>
      ) : (
        <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("admin.fecha")}</TableCell>
                <TableCell>{t("admin.quien")}</TableCell>
                <TableCell>{t("admin.accion")}</TableCell>
                <TableCell>{t("admin.sobre")}</TableCell>
                <TableCell>{t("admin.detalle")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditoria.data.map((entrada) => (
                <TableRow key={entrada.id}>
                  <TableCell>{new Date(entrada.occurredAt).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>{quien(entrada.actorId)}</TableCell>
                  <TableCell>{t(`admin.acciones_${entrada.action.replaceAll(".", "_")}`, { defaultValue: entrada.action })}</TableCell>
                  <TableCell>{quien(entrada.targetId)}</TableCell>
                  <TableCell>{entrada.detail ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
