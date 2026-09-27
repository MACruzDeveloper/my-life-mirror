import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Envoltura de las páginas públicas (portada, registro, login, recuperar
 * contraseña, política de privacidad): solo añade el selector de idioma
 * arriba a la derecha, para que alguien que no lee español pueda cambiar a
 * inglés antes de tener cuenta. Las pantallas protegidas lo tienen en su
 * cabecera (`Header`).
 */
export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <>
      <Box component="nav" aria-label={t("comun.idioma")} sx={{ display: "flex", justifyContent: "flex-end", px: 2, pt: 1 }}>
        <LanguageSwitcher />
      </Box>
      <Outlet />
    </>
  );
}
