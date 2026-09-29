import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { getJson } from "@shared/ui/api/getJson";
import { useSession } from "@shared/ui/context/SessionContext";

const TIME_ZONES = Intl.supportedValuesOf("timeZone");
const DETECTED_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface ProfileResponse {
  name: string;
  birthDate?: string;
  gender?: Gender;
  timeZone?: string;
}

const PROFILE_KEY = ["profile"] as const;

type Estado =
  | { tipo: "listo" }
  | { tipo: "guardando" }
  | { tipo: "guardado" }
  | { tipo: "error"; mensaje: string };

/**
 * Vista de RF-03. Mobile-first (ADR-07 apartado 6): campos apilados en móvil,
 * fecha de nacimiento+género en fila desde `sm` en adelante. `name` ya se
 * capturó en el registro (RF-01) — aquí se puede corregir junto al resto.
 * `birthDate` usa el selector de fecha nativo del navegador (`input
 * type="date"`) — sin librería de calendario, misma disciplina de
 * "alternativa nativa primero" que ya se usó para la zona horaria.
 */
export function ProfileForm() {
  const { t } = useTranslation();
  // `null` = el usuario todavía no tiene perfil (react-query no admite `undefined` como dato).
  const { data, isPending, isError } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => getJson<ProfileResponse | null>("/api/accounts/profile"),
  });

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // El formulario se monta ya con los datos: sus campos arrancan de ahí, sin efectos que los copien.
  return <ProfileFields inicial={data ?? undefined} errorCarga={isError ? t("perfil.errorCarga") : undefined} />;
}

function ProfileFields({ inicial, errorCarga }: { inicial?: ProfileResponse; errorCarga?: string }) {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(inicial?.name ?? "");
  const [birthDate, setBirthDate] = useState(inicial?.birthDate ?? "");
  const [gender, setGender] = useState<Gender | "">(inicial?.gender ?? "");
  const [timeZone, setTimeZone] = useState(inicial?.timeZone ?? DETECTED_TIME_ZONE);
  const [estado, setEstado] = useState<Estado>(errorCarga ? { tipo: "error", mensaje: errorCarga } : { tipo: "listo" });

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

      // La caché refleja lo guardado: al volver a esta pantalla no hace falta pedirlo otra vez.
      const guardado: ProfileResponse = {
        name,
        ...(birthDate ? { birthDate } : {}),
        ...(gender ? { gender } : {}),
        timeZone,
      };
      queryClient.setQueryData<ProfileResponse | null>(PROFILE_KEY, guardado);
      setEstado({ tipo: "guardado" });
      // El Header lee name/email de SessionContext, no de este formulario —
      // sin esto seguiría mostrando lo de antes hasta navegar fuera y volver.
      refresh();
    } catch {
      setEstado({ tipo: "error", mensaje: t("comun.errorServidor") });
    }
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
