import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { HelpFooter } from "./HelpLink";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Envoltura de las páginas públicas (portada, registro, login, recuperar
 * contraseña, política de privacidad): solo añade el selector de idioma
 * arriba a la derecha, para que alguien que no lee español pueda cambiar a
 * inglés antes de tener cuenta. Las pantallas protegidas lo tienen en su
 * cabecera (`Header`). Al pie, el enlace a las líneas de ayuda (RF-30).
 */
export function PublicLayout({ children, overlay = false }: { children?: ReactNode; /** UX-08: la página ocupa toda la pantalla (la portada); el selector va encima de ella y el pie lo pone la propia página. */ overlay?: boolean }) {
  const { t } = useTranslation();

  return (
    <>
      <Box
        component="nav"
        aria-label={t("comun.idioma")}
        sx={[{ display: "flex", justifyContent: "flex-end", px: 2, pt: 1 }, overlay && { position: "fixed", top: 0, right: 0, zIndex: 2, pt: 1.5, color: "common.white" }]}
      >
        <LanguageSwitcher variant={overlay ? "text" : "flags"} />
      </Box>
      {children ?? <Outlet />}
      {overlay ? null : <HelpFooter />}
    </>
  );
}
