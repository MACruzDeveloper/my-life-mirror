import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

interface CatalogDto {
  id: string;
  name: string;
  description: string;
  isSensitiveData: boolean;
  retiredAt?: string;
}

type Estado = { tipo: "cargando" } | { tipo: "listo"; catalogo: CatalogDto[] } | { tipo: "sinPermiso" } | { tipo: "error" };

const POST = (cuerpo: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cuerpo),
});

/**
 * Gestión del catálogo de categorías (ADM-02): añadir y retirar. Solo
 * refleja lo que responde la API — el permiso lo decide el servidor.
 */
export function AdminCategories() {
  const { t } = useTranslation();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSensitiveData, setIsSensitiveData] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | undefined>();
  const [aRetirar, setARetirar] = useState<CatalogDto | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await fetch("/api/admin/categories");
      if (respuesta.status === 403) {
        setEstado({ tipo: "sinPermiso" });
        return;
      }
      if (!respuesta.ok) throw new Error("fallo");
      setEstado({ tipo: "listo", catalogo: (await respuesta.json()) as CatalogDto[] });
    } catch {
      setEstado({ tipo: "error" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos.
    void cargar();
  }, [cargar]);

  async function anadir(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErrorAccion(undefined);
    try {
      const respuesta = await fetch("/api/admin/categories", POST({ name, description, isSensitiveData }));
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        setErrorAccion(datos.error ?? t("admin.errorGuardar"));
        return;
      }
      setName("");
      setDescription("");
      setIsSensitiveData(false);
      await cargar();
    } catch {
      setErrorAccion(t("admin.errorGuardar"));
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarRetirada() {
    if (!aRetirar) return;
    const categoria = aRetirar;
    setARetirar(null);
    setErrorAccion(undefined);
    try {
      const respuesta = await fetch("/api/admin/categories/retire", POST({ categoryId: categoria.id }));
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        setErrorAccion(datos.error ?? t("admin.errorGuardar"));
        return;
      }
      await cargar();
    } catch {
      setErrorAccion(t("admin.errorGuardar"));
    }
  }

  if (estado.tipo === "cargando") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (estado.tipo === "sinPermiso") return <Alert severity="warning">{t("admin.sinPermiso")}</Alert>;
  if (estado.tipo === "error") return <Alert severity="error">{t("admin.errorCarga")}</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="subtitle1">{t("admin.catalogoTitulo")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("admin.catalogoAyuda")}
        </Typography>
      </Box>
      {errorAccion && <Alert severity="error">{errorAccion}</Alert>}

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("admin.nombre")}</TableCell>
              <TableCell>{t("admin.descripcion")}</TableCell>
              <TableCell>{t("admin.estado")}</TableCell>
              <TableCell>{t("admin.acciones")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estado.catalogo.map((categoria) => (
              <TableRow key={categoria.id} sx={categoria.retiredAt ? { opacity: 0.6 } : undefined}>
                <TableCell>
                  {categoria.name}{" "}
                  {categoria.isSensitiveData && <Chip size="small" label={t("admin.sensible")} sx={{ ml: 0.5 }} />}
                </TableCell>
                <TableCell>{categoria.description}</TableCell>
                <TableCell>{categoria.retiredAt ? t("admin.retirada") : t("admin.vigente")}</TableCell>
                <TableCell>
                  {!categoria.retiredAt && (
                    <Button size="small" color="warning" onClick={() => setARetirar(categoria)}>
                      {t("admin.retirar")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box component="form" onSubmit={anadir} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}>
        <Typography variant="subtitle1">{t("admin.anadirTitulo")}</Typography>
        <TextField label={t("admin.nombre")} value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} required size="small" />
        <TextField
          label={t("admin.descripcion")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          required
          size="small"
          multiline
        />
        <FormControlLabel
          control={<Checkbox checked={isSensitiveData} onChange={(e) => setIsSensitiveData(e.target.checked)} />}
          label={t("admin.anadirDatosSensibles")}
        />
        <Button type="submit" variant="contained" disabled={enviando}>
          {enviando ? t("admin.anadiendo") : t("admin.anadir")}
        </Button>
      </Box>

      <Dialog open={aRetirar !== null} onClose={() => setARetirar(null)}>
        <DialogTitle>{t("admin.retirarTitulo", { nombre: aRetirar?.name ?? "" })}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("admin.retirarTexto")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setARetirar(null)}>{t("admin.cancelar")}</Button>
          <Button onClick={() => void confirmarRetirada()} color="warning" variant="contained">
            {t("admin.retirarConfirmar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
