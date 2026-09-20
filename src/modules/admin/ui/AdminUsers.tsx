import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SvgIcon from "@mui/material/SvgIcon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { HttpError } from "@shared/ui/api/getJson";
import { useOptionalSession } from "@shared/ui/context/SessionContext";
import { ADMIN_AUDIT_KEY, ADMIN_USERS_KEY, postAdmin, useAdminUsers, type AdminUserDto } from "./adminQueries";

type TipoAccion = "role" | "email" | "name" | "suspend" | "delete" | "recovery";

/** Acciones que exigen la contraseña del admin (las mismas que exige el servidor). */
const CON_CONTRASENA: TipoAccion[] = ["role", "email", "suspend", "delete"];
const ENDPOINT: Record<TipoAccion, string> = {
  role: "user-role",
  email: "user-email",
  name: "user-name",
  suspend: "user-suspend",
  delete: "user-delete",
  recovery: "user-recovery",
};
const ROLES = ["usuario", "premium", "admin"] as const;

function MoreIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </SvgIcon>
  );
}

/**
 * Gestión de usuarios por el admin (ADM-03). La interfaz solo desactiva lo que
 * el servidor ya prohíbe (suspender/eliminar administradores, cambiarse el rol
 * a uno mismo) para no ofrecerlo; la barrera real es el servidor (sesión +
 * caso de uso + contraseña del admin en las acciones sensibles).
 */
export function AdminUsers() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const usuarios = useAdminUsers();
  const yoEmail = useOptionalSession()?.email;
  const [menu, setMenu] = useState<{ ancla: HTMLElement; usuario: AdminUserDto } | null>(null);
  const [accion, setAccion] = useState<{ tipo: TipoAccion; usuario: AdminUserDto } | null>(null);
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<AdminUserDto["rol"]>("usuario");
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [errorLista, setErrorLista] = useState<string | undefined>();
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ email: "", name: "" });
  const [creada, setCreada] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const sinPermiso = usuarios.error instanceof HttpError && usuarios.error.status === 403;
  const fecha = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : t("admin.nunca"));

  async function refrescar() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY }), queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_KEY })]);
  }

  /** Errores de las acciones, explicados en el idioma de la interfaz (los mensajes del servidor están en inglés). */
  function explicar(status: number, esCreacionOEmail: boolean): string {
    if (status === 403) return t("admin.errorContrasena");
    if (status === 409) return esCreacionOEmail ? t("admin.errorEmailEnUso") : t("admin.errorRegla");
    if (status === 404) return t("admin.errorNoEncontrado");
    if (status === 400) return t("admin.errorDatos");
    return t("admin.errorGuardar");
  }

  function abrirAccion(tipo: TipoAccion, usuario: AdminUserDto) {
    setMenu(null);
    setPassword("");
    setError(undefined);
    setValor(tipo === "name" ? (usuario.name ?? "") : "");
    setRol(usuario.rol);
    setAccion({ tipo, usuario });
  }

  function cerrarAccion() {
    if (enviando) return;
    setAccion(null);
  }

  async function reactivar(usuario: AdminUserDto) {
    setMenu(null);
    setErrorLista(undefined);
    try {
      const r = await postAdmin("user-reactivate", { userId: usuario.id });
      if (!r.ok) setErrorLista(explicar(r.status, false));
      else await refrescar();
    } catch {
      setErrorLista(t("comun.errorServidor"));
    }
  }

  async function confirmar() {
    if (!accion) return;
    const { tipo, usuario } = accion;
    const cuerpo: Record<string, unknown> = { userId: usuario.id };
    if (tipo === "role") cuerpo.rol = rol;
    if (tipo === "email") cuerpo.email = valor;
    if (tipo === "name") cuerpo.name = valor;
    if (CON_CONTRASENA.includes(tipo)) cuerpo.password = password;

    setEnviando(true);
    setError(undefined);
    try {
      const r = await postAdmin(ENDPOINT[tipo], cuerpo);
      if (!r.ok) {
        setError(explicar(r.status, tipo === "email"));
        return;
      }
      setAccion(null);
      await refrescar();
    } catch {
      setError(t("comun.errorServidor"));
    } finally {
      setEnviando(false);
    }
  }

  async function crear() {
    setEnviando(true);
    setError(undefined);
    try {
      const r = await postAdmin<{ email: string; temporaryPassword: string }>("user-create", nuevo);
      if (!r.ok) {
        setError(explicar(r.status, true));
        return;
      }
      setCreada({ email: r.data.email, temporaryPassword: r.data.temporaryPassword });
      await refrescar();
    } catch {
      setError(t("comun.errorServidor"));
    } finally {
      setEnviando(false);
    }
  }

  function cerrarCreacion() {
    // La contraseña temporal no se conserva en memoria una vez cerrado el cuadro.
    setCreando(false);
    setCreada(null);
    setNuevo({ email: "", name: "" });
    setError(undefined);
  }

  if (usuarios.isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (sinPermiso) return <Alert severity="warning">{t("admin.sinPermiso")}</Alert>;
  if (usuarios.isError) return <Alert severity="error">{t("admin.errorCarga")}</Alert>;

  const lista = usuarios.data;
  const necesitaContrasena = accion ? CON_CONTRASENA.includes(accion.tipo) : false;
  const faltaDato = accion ? ((accion.tipo === "email" || accion.tipo === "name") && valor.trim().length === 0) : false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="subtitle1">
          {t("admin.usuarios")} · {t("admin.total", { count: lista.length })}
        </Typography>
        <Button variant="contained" size="small" onClick={() => setCreando(true)}>
          {t("admin.crearUsuario")}
        </Button>
      </Box>
      {errorLista && <Alert severity="error">{errorLista}</Alert>}

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("admin.nombre")}</TableCell>
              <TableCell>{t("admin.email")}</TableCell>
              <TableCell>{t("admin.rol")}</TableCell>
              <TableCell>{t("admin.estado")}</TableCell>
              <TableCell>{t("admin.alta")}</TableCell>
              <TableCell>{t("admin.ultimoAcceso")}</TableCell>
              <TableCell>{t("admin.acciones")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.name ?? t("admin.nunca")}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.rol}</TableCell>
                <TableCell>
                  {usuario.suspendido ? <Chip size="small" color="warning" label={t("admin.suspendida")} /> : t("admin.activa")}
                </TableCell>
                <TableCell>{fecha(usuario.createdAt)}</TableCell>
                <TableCell>{fecha(usuario.lastSignInAt)}</TableCell>
                <TableCell>
                  <IconButton size="small" aria-label={t("admin.accionesDe", { email: usuario.email })} onClick={(e) => setMenu({ ancla: e.currentTarget, usuario })}>
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={menu?.ancla} open={menu !== null} onClose={() => setMenu(null)}>
        {menu && (
          <MenuItem disabled={menu.usuario.email === yoEmail} onClick={() => abrirAccion("role", menu.usuario)}>
            {t("admin.cambiarRol")}
          </MenuItem>
        )}
        {menu && <MenuItem onClick={() => abrirAccion("email", menu.usuario)}>{t("admin.cambiarEmail")}</MenuItem>}
        {menu && <MenuItem onClick={() => abrirAccion("name", menu.usuario)}>{t("admin.cambiarNombre")}</MenuItem>}
        {menu && <MenuItem onClick={() => abrirAccion("recovery", menu.usuario)}>{t("admin.enlaceRecuperacion")}</MenuItem>}
        {menu &&
          (menu.usuario.suspendido ? (
            <MenuItem onClick={() => void reactivar(menu.usuario)}>{t("admin.reactivar")}</MenuItem>
          ) : (
            <MenuItem disabled={menu.usuario.rol === "admin"} onClick={() => abrirAccion("suspend", menu.usuario)}>
              {t("admin.suspender")}
            </MenuItem>
          ))}
        {menu && (
          <MenuItem disabled={menu.usuario.rol === "admin"} onClick={() => abrirAccion("delete", menu.usuario)} sx={{ color: "error.main" }}>
            {t("admin.eliminar")}
          </MenuItem>
        )}
      </Menu>

      <Dialog open={accion !== null} onClose={cerrarAccion} fullWidth maxWidth="xs">
        {accion && (
          <>
            <DialogTitle>{t(`admin.dialogo.${accion.tipo}`, { email: accion.usuario.email })}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DialogContentText>{t(`admin.dialogoTexto.${accion.tipo}`)}</DialogContentText>
              {error && <Alert severity="error">{error}</Alert>}
              {accion.tipo === "role" && (
                <TextField select label={t("admin.rol")} value={rol} onChange={(e) => setRol(e.target.value as AdminUserDto["rol"])} fullWidth>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {accion.tipo === "email" && <TextField label={t("admin.nuevoEmail")} type="email" value={valor} onChange={(e) => setValor(e.target.value)} fullWidth autoFocus />}
              {accion.tipo === "name" && <TextField label={t("admin.nuevoNombre")} value={valor} onChange={(e) => setValor(e.target.value)} fullWidth autoFocus />}
              {necesitaContrasena && (
                <TextField label={t("admin.tuContrasena")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={cerrarAccion} disabled={enviando}>
                {t("admin.cancelar")}
              </Button>
              <Button
                onClick={() => void confirmar()}
                variant="contained"
                color={accion.tipo === "delete" ? "error" : "primary"}
                disabled={enviando || faltaDato || (necesitaContrasena && password.length === 0)}
              >
                {t("admin.confirmar")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={creando} onClose={cerrarCreacion} fullWidth maxWidth="xs">
        <DialogTitle>{t("admin.crearUsuario")}</DialogTitle>
        {creada ? (
          <>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="warning">{t("admin.contrasenaTemporalAviso")}</Alert>
              <Typography variant="body2">{creada.email}</Typography>
              <Typography variant="h6" component="p" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {creada.temporaryPassword}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("admin.contrasenaTemporalConsejo")}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => void navigator.clipboard?.writeText(creada.temporaryPassword)}>{t("admin.copiar")}</Button>
              <Button variant="contained" onClick={cerrarCreacion}>
                {t("admin.cerrar")}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DialogContentText>{t("admin.dialogoTexto.create")}</DialogContentText>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label={t("admin.email")} type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} fullWidth autoFocus />
              <TextField label={t("admin.nombre")} value={nuevo.name} onChange={(e) => setNuevo({ ...nuevo, name: e.target.value })} fullWidth />
            </DialogContent>
            <DialogActions>
              <Button onClick={cerrarCreacion} disabled={enviando}>
                {t("admin.cancelar")}
              </Button>
              <Button variant="contained" onClick={() => void crear()} disabled={enviando || nuevo.email.trim().length === 0 || nuevo.name.trim().length === 0}>
                {t("admin.crear")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
