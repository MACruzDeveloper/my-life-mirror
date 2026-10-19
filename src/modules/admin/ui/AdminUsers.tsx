import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ADMIN_PANEL_SX, ADMIN_TABLE_HEAD_SX } from "./adminStyles";
import { useTranslation } from "react-i18next";
import { HttpError } from "@shared/ui/api/getJson";
import { useOptionalSession } from "@shared/ui/context/SessionContext";
import { ADMIN_AUDIT_KEY, ADMIN_USERS_KEY, postAdmin, useAdminUsers, type AdminUserDto } from "./adminQueries";

import { USER_ROLES } from "@modules/accounts/domain/UserRole";
import { PageLoader } from "@shared/ui/components/PageLoader";

type ActionType = "role" | "email" | "name" | "suspend" | "delete" | "recovery";

/** Acciones que exigen la contraseña del admin (las mismas que exige el servidor). */
const WITH_PASSWORD: ActionType[] = ["role", "email", "suspend", "delete"];
const ENDPOINT: Record<ActionType, string> = {
  role: "user-role",
  email: "user-email",
  name: "user-name",
  suspend: "user-suspend",
  delete: "user-delete",
  recovery: "user-recovery",
};

/**
 * Gestión de usuarios por el admin (ADM-03). La interfaz solo desactiva lo que
 * el servidor ya prohíbe (suspender/eliminar administradores, cambiarse el rol
 * a uno mismo) para no ofrecerlo; la barrera real es el servidor (sesión +
 * caso de uso + contraseña del admin en las acciones sensibles).
 */
export function AdminUsers() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const users = useAdminUsers();
  const myEmail = useOptionalSession()?.email;
  const [menu, setMenu] = useState<{ anchor: HTMLElement; user: AdminUserDto } | null>(null);
  const [action, setAction] = useState<{ kind: ActionType; user: AdminUserDto } | null>(null);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUserDto["rol"]>("usuario");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [listError, setListError] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ email: "", name: "" });
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const noPermission = users.error instanceof HttpError && users.error.status === 403;
  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : t("admin.nunca"));

  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }), queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_KEY })]);
  }

  /** Errores de las acciones, explicados en el idioma de la interfaz (los mensajes del servidor están en inglés). */
  function explain(status: number, isCreationOrEmail: boolean): string {
    if (status === 403) return t("admin.errorContrasena");
    if (status === 409) return isCreationOrEmail ? t("admin.errorEmailEnUso") : t("admin.errorRegla");
    if (status === 404) return t("admin.errorNoEncontrado");
    if (status === 400) return t("admin.errorDatos");
    return t("admin.errorGuardar");
  }

  function openAction(kind: ActionType, user: AdminUserDto) {
    setMenu(null);
    setPassword("");
    setError(undefined);
    setValue(kind === "name" ? (user.name ?? "") : "");
    setRole(user.rol);
    setAction({ kind: kind, user: user });
  }

  function closeAction() {
    if (sending) return;
    setAction(null);
  }

  async function reactivate(user: AdminUserDto) {
    setMenu(null);
    setListError(undefined);
    try {
      const r = await postAdmin("user-reactivate", { userId: user.id });
      if (!r.ok) setListError(explain(r.status, false));
      else await refresh();
    } catch {
      setListError(t("comun.errorServidor"));
    }
  }

  async function confirmAction() {
    if (!action) return;
    const { kind, user } = action;
    const body: Record<string, unknown> = { userId: user.id };
    if (kind === "role") body.rol = role;
    if (kind === "email") body.email = value;
    if (kind === "name") body.name = value;
    if (WITH_PASSWORD.includes(kind)) body.password = password;

    setSending(true);
    setError(undefined);
    try {
      const r = await postAdmin(ENDPOINT[kind], body);
      if (!r.ok) {
        setError(explain(r.status, kind === "email"));
        return;
      }
      setAction(null);
      await refresh();
    } catch {
      setError(t("comun.errorServidor"));
    } finally {
      setSending(false);
    }
  }

  async function create() {
    setSending(true);
    setError(undefined);
    try {
      const r = await postAdmin<{ email: string; temporaryPassword: string }>("user-create", draft);
      if (!r.ok) {
        setError(explain(r.status, true));
        return;
      }
      setCreated({ email: r.data.email, temporaryPassword: r.data.temporaryPassword });
      await refresh();
    } catch {
      setError(t("comun.errorServidor"));
    } finally {
      setSending(false);
    }
  }

  function closeCreation() {
    // La contraseña temporal no se conserva en memoria una vez cerrado el cuadro.
    setCreating(false);
    setCreated(null);
    setDraft({ email: "", name: "" });
    setError(undefined);
  }

  if (users.isPending) {
    return (
      <PageLoader />
    );
  }
  if (noPermission) return <Alert severity="warning">{t("admin.sinPermiso")}</Alert>;
  if (users.isError) return <Alert severity="error">{t("admin.errorCarga")}</Alert>;

  const list = users.data;
  const needsPassword = action ? WITH_PASSWORD.includes(action.kind) : false;
  const missingValue = action ? ((action.kind === "email" || action.kind === "name") && value.trim().length === 0) : false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {t("admin.usuarios")} · {t("admin.total", { count: list.length })}
        </Typography>
        <Button variant="contained" size="small" onClick={() => setCreating(true)}>
          {t("admin.crearUsuario")}
        </Button>
      </Box>
      {listError && <Alert severity="error">{listError}</Alert>}

      <TableContainer sx={ADMIN_PANEL_SX}>
        <Table size="small">
          <TableHead sx={ADMIN_TABLE_HEAD_SX}>
            <TableRow>
              <TableCell>{t("admin.nombre")}</TableCell>
              <TableCell>{t("admin.email")}</TableCell>
              <TableCell>{t("admin.rol")}</TableCell>
              <TableCell>{t("admin.estado")}</TableCell>
              <TableCell>{t("admin.alta")}</TableCell>
              <TableCell>{t("admin.ultimoAcceso")}</TableCell>
              <TableCell align="center">{t("admin.acciones")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name ?? t("admin.nunca")}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.rol}</TableCell>
                <TableCell>
                  {user.suspendido ? <Chip size="small" color="warning" label={t("admin.suspendida")} /> : t("admin.activa")}
                </TableCell>
                <TableCell>{date(user.createdAt)}</TableCell>
                <TableCell>{date(user.lastSignInAt)}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" aria-label={t("admin.accionesDe", { email: user.email })} onClick={(e) => setMenu({ anchor: e.currentTarget, user: user })}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menu?.anchor} open={menu !== null} onClose={() => setMenu(null)}>
        {menu && (
          <MenuItem disabled={menu.user.email === myEmail} onClick={() => openAction("role", menu.user)}>
            {t("admin.cambiarRol")}
          </MenuItem>
        )}
        {menu && <MenuItem onClick={() => openAction("email", menu.user)}>{t("admin.cambiarEmail")}</MenuItem>}
        {menu && <MenuItem onClick={() => openAction("name", menu.user)}>{t("admin.cambiarNombre")}</MenuItem>}
        {menu && <MenuItem onClick={() => openAction("recovery", menu.user)}>{t("admin.enlaceRecuperacion")}</MenuItem>}
        {menu &&
          (menu.user.suspendido ? (
            <MenuItem onClick={() => void reactivate(menu.user)}>{t("admin.reactivar")}</MenuItem>
          ) : (
            <MenuItem disabled={menu.user.rol === "admin"} onClick={() => openAction("suspend", menu.user)}>
              {t("admin.suspender")}
            </MenuItem>
          ))}
        {menu && (
          <MenuItem disabled={menu.user.rol === "admin"} onClick={() => openAction("delete", menu.user)} sx={{ color: "error.main" }}>
            {t("admin.eliminar")}
          </MenuItem>
        )}
      </Menu>

      <Dialog open={action !== null} onClose={closeAction} fullWidth maxWidth="xs">
        {action && (
          <>
            <DialogTitle>{t(`admin.dialogo.${action.kind}`, { email: action.user.email })}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DialogContentText>{t(`admin.dialogoTexto.${action.kind}`)}</DialogContentText>
              {error && <Alert severity="error">{error}</Alert>}
              {action.kind === "role" && (
                <TextField select label={t("admin.rol")} value={role} onChange={(e) => setRole(e.target.value as AdminUserDto["rol"])} fullWidth>
                  {USER_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {action.kind === "email" && <TextField label={t("admin.nuevoEmail")} type="email" value={value} onChange={(e) => setValue(e.target.value)} fullWidth autoFocus />}
              {action.kind === "name" && <TextField label={t("admin.nuevoNombre")} value={value} onChange={(e) => setValue(e.target.value)} fullWidth autoFocus />}
              {needsPassword && (
                <TextField label={t("admin.tuContrasena")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAction} disabled={sending}>
                {t("admin.cancelar")}
              </Button>
              <Button
                onClick={() => void confirmAction()}
                variant="contained"
                color={action.kind === "delete" ? "error" : "primary"}
                disabled={sending || missingValue || (needsPassword && password.length === 0)}
              >
                {t("admin.confirmar")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={creating} onClose={closeCreation} fullWidth maxWidth="xs">
        <DialogTitle>{t("admin.crearUsuario")}</DialogTitle>
        {created ? (
          <>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="warning">{t("admin.contrasenaTemporalAviso")}</Alert>
              <Typography variant="body2">{created.email}</Typography>
              <Typography variant="h6" component="p" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {created.temporaryPassword}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("admin.contrasenaTemporalConsejo")}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => void navigator.clipboard?.writeText(created.temporaryPassword)}>{t("admin.copiar")}</Button>
              <Button variant="contained" onClick={closeCreation}>
                {t("admin.cerrar")}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DialogContentText>{t("admin.dialogoTexto.create")}</DialogContentText>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label={t("admin.email")} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} fullWidth autoFocus />
              <TextField label={t("admin.nombre")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} fullWidth />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeCreation} disabled={sending}>
                {t("admin.cancelar")}
              </Button>
              <Button variant="contained" onClick={() => void create()} disabled={sending || draft.email.trim().length === 0 || draft.name.trim().length === 0}>
                {t("admin.crear")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
