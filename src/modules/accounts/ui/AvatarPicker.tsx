import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import NoAccountsIcon from "@mui/icons-material/NoAccounts";
import { useTranslation } from "react-i18next";
import { publishedAvatarKeys } from "@modules/accounts/domain/avatars";
import { UserAvatar } from "@shared/ui/components/UserAvatar";

const AVATAR_SIZE = 56;

interface AvatarPickerProps {
  /** La clave elegida; sin valor, "Sin avatar". */
  value?: string;
  onChange: (avatarKey: string | undefined) => void;
  /** Para los tests; por defecto, los publicados del catálogo. */
  keys?: readonly string[];
}

/**
 * RF-26: elegir un avatar del catálogo cerrado (generados con IA y revisados
 * uno a uno por el autor) o no llevar ninguno. Un grupo de opciones, como
 * unos botones de radio: se recorre con el teclado y cada imagen se anuncia
 * con su descripción. Sin avatares publicados no se enseña nada.
 */
export function AvatarPicker({ value, onChange, keys = publishedAvatarKeys() }: AvatarPickerProps) {
  const { t } = useTranslation();
  if (keys.length === 0) return null;

  const option = (avatarKey: string | undefined, label: string, content: React.ReactNode) => {
    const selected = value === avatarKey;
    return (
      <ButtonBase
        key={avatarKey ?? "none"}
        role="radio"
        aria-checked={selected}
        aria-label={label}
        onClick={() => onChange(avatarKey)}
        sx={{ borderRadius: "50%", p: 0.5, border: 2, borderColor: selected ? "primary.main" : "transparent", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}
      >
        {content}
      </ButtonBase>
    );
  };

  return (
    <Box>
      <Typography id="avatar-picker-label" variant="subtitle1" component="h2">
        {t("avatares.titulo")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("avatares.ayuda")}
      </Typography>
      <Box role="radiogroup" aria-labelledby="avatar-picker-label" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {option(
          undefined,
          t("avatares.quitar"),
          <Box sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: "50%", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
            <NoAccountsIcon />
          </Box>,
        )}
        {keys.map((avatarKey) => option(avatarKey, t(`avatares.descripciones.${avatarKey}`), <UserAvatar avatarKey={avatarKey} size={AVATAR_SIZE} />))}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
        {t("avatares.generadosConIA")}
      </Typography>
    </Box>
  );
}
