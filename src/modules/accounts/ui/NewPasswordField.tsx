import { useId, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";
import { PASSWORD_RULES, type PasswordContext, type PasswordRule, checkPassword } from "@modules/accounts/domain/passwordPolicy";

/** Los que se pueden ir cumpliendo al escribir; el resto solo se enseña cuando falla. */
const ALWAYS_SHOWN: readonly PasswordRule[] = ["length", "lowercase", "uppercase", "digit", "symbol"];

type RequirementState = "met" | "pending" | "missing";

const STATE_COLOR: Record<RequirementState, string> = { met: "success.main", pending: "text.secondary", missing: "error.main" };
const STATE_ICON = { met: CheckIcon, pending: FiberManualRecordIcon, missing: CloseIcon } as const;
/** Marcas pequeñas, del tamaño del texto: lo pendiente, un punto. */
const STATE_ICON_SIZE: Record<RequirementState, number> = { met: 14, pending: 6, missing: 14 };

interface NewPasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** El nombre y el email de quien la elige: la contraseña no puede contenerlos. */
  context?: PasswordContext;
  /** Tras intentar enviar: lo que falta pasa de "pendiente" a error. */
  showErrors: boolean;
  /** Requisitos que el servidor ha rechazado (por si su comprobación y la del navegador difieren). */
  serverRules?: readonly PasswordRule[];
}

/**
 * Campo para una contraseña NUEVA (registro y cambio, SEC-01): los requisitos
 * están plegados tras un botón de información (ocupaban medio formulario) y se
 * van marcando al escribir; si se intenta enviar una que no cumple, se abren
 * solos para decir qué falta. Usa la misma función que el servidor
 * (`checkPassword`). Nunca en el inicio de sesión: ahí no se dan pistas.
 */
export function NewPasswordField({ label, value, onChange, context, showErrors, serverRules = [] }: NewPasswordFieldProps) {
  const { t } = useTranslation();
  const requirementsId = useId();
  const [visible, setVisible] = useState(false);
  const failed = new Set<PasswordRule>([...checkPassword(value, context), ...serverRules]);
  // Lo que elige la persona manda; mientras no elija, se abren solo si hay algo que corregir.
  const [chosenOpen, setChosenOpen] = useState<boolean>();
  const open = chosenOpen ?? (showErrors && failed.size > 0);

  const stateOf = (rule: PasswordRule): RequirementState => {
    if (!failed.has(rule)) return "met";
    return showErrors || !ALWAYS_SHOWN.includes(rule) ? "missing" : "pending";
  };
  const shownRules = PASSWORD_RULES.filter((rule) => ALWAYS_SHOWN.includes(rule) || (value.length > 0 && failed.has(rule)));

  return (
    <Box>
      <TextField
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        error={showErrors && failed.size > 0}
        required
        fullWidth
        autoComplete="new-password"
        slotProps={{
          htmlInput: { "aria-describedby": open ? requirementsId : undefined },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setChosenOpen(!open)} aria-label={t("contrasena.verRequisitos")} aria-expanded={open} aria-controls={open ? requirementsId : undefined}>
                  <InfoOutlinedIcon />
                </IconButton>
                <IconButton onClick={() => setVisible((current) => !current)} edge="end" aria-label={t(visible ? "contrasena.ocultar" : "contrasena.mostrar")}>
                  {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {open && (
        <Box sx={{ mt: 1 }}>
          <Typography id={`${requirementsId}-title`} variant="caption" component="p" sx={{ color: "text.secondary" }}>
            {t("contrasena.requisitos")}
          </Typography>
          <Box component="ul" id={requirementsId} aria-labelledby={`${requirementsId}-title`} sx={{ listStyle: "none", m: 0, mt: 0.25, p: 0 }}>
            {shownRules.map((rule) => {
              const state = stateOf(rule);
              const Icon = STATE_ICON[state];
              return (
                <Box component="li" key={rule} data-state={state} sx={{ display: "flex", alignItems: "center", gap: 0.75, color: STATE_COLOR[state] }}>
                  <Box component="span" sx={{ display: "inline-flex", justifyContent: "center", width: 14, flexShrink: 0 }}>
                    <Icon titleAccess={t(`contrasena.estado.${state}`)} sx={{ fontSize: STATE_ICON_SIZE[state] }} />
                  </Box>
                  <Typography variant="caption" component="span" sx={{ color: state === "pending" ? "text.secondary" : "inherit" }}>
                    {t(`contrasena.reglas.${rule}`)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Typography variant="caption" component="p" sx={{ mt: 0.5, color: "text.secondary" }}>
            {t("contrasena.consejo")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
