import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { Gender } from "@modules/cuentas/domain/Profile";
import { useSession } from "@shared/ui/context/SessionContext";

const TIME_ZONES = Intl.supportedValuesOf("timeZone");
const DETECTED_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface ProfileResponse {
  name: string;
  birthDate?: string;
  gender?: Gender;
  timeZone?: string;
}

type Estado =
  | { tipo: "cargando" }
  | { tipo: "listo" }
  | { tipo: "guardando" }
  | { tipo: "guardado" }
  | { tipo: "error"; mensaje: string };

/**
 * Vista de RF-03. Mobile-first (ADR-07 §6): campos apilados en móvil,
 * fecha de nacimiento+género en fila desde `sm` en adelante. `name` ya se
 * capturó en el registro (RF-01) — aquí se puede corregir junto al resto.
 * `birthDate` usa el selector de fecha nativo del navegador (`input
 * type="date"`) — sin librería de calendario, misma disciplina de
 * "alternativa nativa primero" que ya se usó para la zona horaria.
 */
export function ProfileForm() {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [timeZone, setTimeZone] = useState(DETECTED_TIME_ZONE);
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    let cancelado = false;

    fetch("/api/accounts/profile")
      .then((respuesta) => respuesta.json())
      .then((datos: ProfileResponse | null) => {
        if (cancelado) return;
        if (datos) {
          setName(datos.name);
          setBirthDate(datos.birthDate ?? "");
          setGender(datos.gender ?? "");
          setTimeZone(datos.timeZone ?? DETECTED_TIME_ZONE);
        }
        setEstado({ tipo: "listo" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "error", mensaje: t("perfil.errorCarga") });
      });

    return () => {
      cancelado = true;
    };
  }, [t]);

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado({ tipo: "guardando" });

    try {
      const respuesta = await fetch("/api/accounts/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(birthDate ? { birthDate } : {}),
          ...(gender ? { gender } : {}),
          timeZone,
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: datos.error ?? t("perfil.errorGenerico") });
        return;
      }

      setEstado({ tipo: "guardado" });
      // El Header lee name/email de SessionContext, no de este formulario —
      // sin esto seguiría mostrando lo de antes hasta navegar fuera y volver.
      refresh();
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
  }

  if (estado.tipo === "cargando") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={manejarEnvio}
      sx={{ maxWidth: { xs: "100%", sm: 480 }, mx: "auto", mt: 4, px: 2 }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        {t("perfil.titulo")}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {estado.tipo === "error" && <Alert severity="error">{estado.mensaje}</Alert>}
        {estado.tipo === "guardado" && <Alert severity="success">{t("perfil.exito")}</Alert>}
        <TextField label={t("perfil.nombre")} value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
          <TextField
            label={t("perfil.fechaNacimiento")}
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            select
            label={t("perfil.genero")}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | "")}
            fullWidth
          >
            <MenuItem value="">{t("perfil.generoSinEspecificar")}</MenuItem>
            <MenuItem value="woman">{t("perfil.generoMujer")}</MenuItem>
            <MenuItem value="man">{t("perfil.generoHombre")}</MenuItem>
            <MenuItem value="non-binary">{t("perfil.generoNoBinario")}</MenuItem>
            <MenuItem value="prefer-not-to-say">{t("perfil.generoPrefieroNoDecirlo")}</MenuItem>
          </TextField>
        </Box>
        <Autocomplete
          options={TIME_ZONES}
          value={timeZone}
          onChange={(_evento, valor) => setTimeZone(valor ?? "")}
          disableClearable
          renderInput={(params) => <TextField {...params} label={t("perfil.zonaHoraria")} required />}
        />
        <Button type="submit" variant="contained" disabled={estado.tipo === "guardando"} fullWidth>
          {estado.tipo === "guardando" ? t("perfil.botonEnviando") : t("perfil.boton")}
        </Button>
      </Box>
    </Box>
  );
}
