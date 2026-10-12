import Avatar from "@mui/material/Avatar";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

/** Dónde sirve la app la imagen de un avatar publicado del catálogo (RF-26): archivos estáticos revisados uno a uno. */
// eslint-disable-next-line react-refresh/only-export-components -- la ruta va junto al único componente que la pinta.
export function avatarSrc(avatarKey: string): string {
  return `/avatars/${avatarKey}.webp`;
}

/**
 * Un avatar del catálogo (RF-26), con su descripción como texto alternativo.
 * Solo recibe la clave: qué claves existen lo decide el módulo de cuentas.
 */
export function UserAvatar({ avatarKey, size = 32, sx }: { avatarKey: string; size?: number; sx?: SxProps<Theme> }) {
  const { t } = useTranslation();
  return <Avatar src={avatarSrc(avatarKey)} alt={t(`avatares.descripciones.${avatarKey}`)} sx={[{ width: size, height: size }, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
