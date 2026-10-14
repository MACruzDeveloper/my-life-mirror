import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { Gender } from "@modules/accounts/domain/Profile";
import { HOBBIES, MAX_HOBBIES, OCCUPATIONS } from "@modules/accounts/domain/profileInterests";
import { PERSONALIZED_IDEAS_KEY } from "@modules/recommendations/ui/queries";
import { PROFILE_KEY, useProfile, type ProfileResponse } from "./queries";
import { useSession } from "@shared/ui/context/SessionContext";
import { AvatarPicker } from "./AvatarPicker";
import { AiProfilePreview } from "./AiProfilePreview";

const TIME_ZONES = Intl.supportedValuesOf("timeZone");
const DETECTED_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;


type FormState =
  | { kind: "listo" }
  | { kind: "guardando" }
  | { kind: "guardado" }
  | { kind: "error"; message: string };

/**
 * Vista de RF-03. Mobile-first (ADR-07 apartado 6): campos apilados en móvil,
 * fecha de nacimiento+género en fila desde `sm` en adelante. `name` ya se
 * capturó en el registro (RF-01) — aquí se puede corregir junto al resto.
 * `birthDate` usa el selector de fecha nativo del navegador (`input
 * type="date"`) — sin librería de calendario, misma disciplina de
 * "alternativa nativa primero" que ya se usó para la zona horaria.
 */
export function ProfileForm({ avatarKeys }: { /** Para los tests; por defecto, los avatares publicados. */ avatarKeys?: readonly string[] } = {}) {
  const { t } = useTranslation();
  // `null` = el usuario todavía no tiene perfil (react-query no admite `undefined` como dato).
  const { data, isPending, isError } = useProfile();

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // El formulario se monta ya con los datos: sus campos arrancan de ahí, sin efectos que los copien.
  return <ProfileFields initial={data ?? undefined} loadError={isError ? t("perfil.errorCarga") : undefined} avatarKeys={avatarKeys} />;
}

function ProfileFields({ initial: inicial, loadError: errorCarga, avatarKeys }: { initial?: ProfileResponse; loadError?: string; avatarKeys?: readonly string[] }) {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(inicial?.name ?? "");
  const [birthDate, setBirthDate] = useState(inicial?.birthDate ?? "");
  const [gender, setGender] = useState<Gender | "">(inicial?.gender ?? "");
  const [timeZone, setTimeZone] = useState(inicial?.timeZone ?? DETECTED_TIME_ZONE);
  const [avatarKey, setAvatarKey] = useState(inicial?.avatarKey);
  const [occupation, setOccupation] = useState(inicial?.occupation ?? "");
  const [hobbies, setHobbies] = useState<string[]>(inicial?.hobbies ?? []);
  const hobbiesTitleId = useId();

  function toggleHobby(hobby: string) {
    setHobbies((current) => (current.includes(hobby) ? current.filter((key) => key !== hobby) : current.length < MAX_HOBBIES ? [...current, hobby] : current));
  }
  const [formState, setFormState] = useState<FormState>(errorCarga ? { kind: "error", message: errorCarga } : { kind: "listo" });

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setFormState({ kind: "guardando" });

    try {
      const response = await fetch("/api/accounts/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(birthDate ? { birthDate } : {}),
          ...(gender ? { gender } : {}),
          timeZone,
          // RF-26: `null` quita el avatar.
          avatarKey: avatarKey ?? null,
          // RF-46: `null` quita la profesión; la lista vacía, las aficiones.
          occupation: occupation || null,
          hobbies,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFormState({ kind: "error", message: data.error ?? t("perfil.errorGenerico") });
        return;
      }

      // La caché refleja lo guardado: al volver a esta pantalla no hace falta pedirlo otra vez.
      // Se guarda el perfil que devuelve el servidor, entero: construirlo aquí con los campos
      // del formulario borraba de la caché lo que este formulario no toca (la elección de IA).
      queryClient.setQueryData<ProfileResponse | null>(PROFILE_KEY, data as ProfileResponse);
      // RF-46: el servidor borra las ideas escritas con el perfil anterior; aquí, las de la caché.
      queryClient.removeQueries({ queryKey: PERSONALIZED_IDEAS_KEY });
      setFormState({ kind: "guardado" });
      // El Header lee name/email de SessionContext, no de este formulario —
      // sin esto seguiría mostrando lo de antes hasta navegar fuera y volver.
      refresh();
    } catch {
      setFormState({ kind: "error", message: t("comun.errorServidor") });
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" }, columnGap: 5, rowGap: 3, alignItems: "start" }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, maxWidth: 760 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {t("perfil.titulo")}
      </Typography>
        {formState.kind === "error" && <Alert severity="error">{formState.message}</Alert>}
        {formState.kind === "guardado" && <Alert severity="success">{t("perfil.exito")}</Alert>}
        {/* Los campos de texto, estrechos (se leen mejor); aficiones y avatar, a todo lo ancho. */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: { sm: 560 } }}>
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
          onChange={(_evento, value) => setTimeZone(value ?? "")}
          disableClearable
          renderInput={(params) => <TextField {...params} label={t("perfil.zonaHoraria")} required />}
        />
        <TextField select label={t("perfil.profesion")} value={occupation} onChange={(e) => setOccupation(e.target.value)} fullWidth>
          <MenuItem value="">{t("perfil.profesionSinEspecificar")}</MenuItem>
          {OCCUPATIONS.map((key) => (
            <MenuItem key={key} value={key}>
              {t(`perfil.ocupaciones.${key}`)}
            </MenuItem>
          ))}
        </TextField>
        </Box>
        <Box role="group" aria-labelledby={hobbiesTitleId}>
          <Typography id={hobbiesTitleId} variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
            {t("perfil.aficionesTitulo")}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            {t("perfil.aficionesAyuda", { max: MAX_HOBBIES })}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {HOBBIES.map((key) => {
              const selected = hobbies.includes(key);
              return (
                <Chip
                  key={key}
                  label={t(`perfil.aficiones.${key}`)}
                  component="button"
                  type="button"
                  aria-pressed={selected}
                  disabled={!selected && hobbies.length >= MAX_HOBBIES}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => toggleHobby(key)}
                />
              );
            })}
          </Box>
        </Box>
        <AvatarPicker value={avatarKey} onChange={setAvatarKey} keys={avatarKeys} />
        <Button type="submit" variant="contained" disabled={formState.kind === "guardando"} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, minWidth: { sm: 220 } }}>
          {formState.kind === "guardando" ? t("perfil.botonEnviando") : t("perfil.boton")}
        </Button>
      </Box>
      {/* Al lado del formulario en pantallas anchas; debajo en móvil. Fija al desplazarse. */}
      <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
        <AiProfilePreview occupation={occupation} hobbies={hobbies} />
      </Box>
    </Box>
  );
}
