import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router";
import { Breadcrumbs, type BreadcrumbItem, PAGE_MAX_WIDTH, WIDE_PAGE_MAX_WIDTH } from "./Breadcrumbs";
import { Header } from "./Header";
import { HelpFooter } from "./HelpLink";
import { useSession } from "../context/SessionContext";

export interface ProtectedLayoutProps {
  /**
   * Sin migas: pantallas de nivel superior dentro del área autenticada (Home).
   * Tipo `MigaDePan` (de Breadcrumbs.tsx) sin traducir todavía — pendiente,
   * ver AGENTS.md sobre nombres en inglés.
   */
  breadcrumbs?: BreadcrumbItem[];
  /** Página ancha (con menú lateral): las migas se alinean con su contenedor. */
  wide?: boolean;
  /** Landing con imagen de cabecera: la cabecera de la app va transparente encima de ella (ver `Header`). */
  overlayHeader?: boolean;
  children: ReactNode;
}

/**
 * Envoltura visual común a toda pantalla protegida (RF-39): `Header` +
 * breadcrumbs opcionales. Factorizado de `Home` en cuanto apareció una
 * segunda pantalla protegida (RF-03) — evita repetir el cableado de
 * sesión/cierre de sesión en cada página nueva. Lee de `useSession`
 * (contexto instalado por `ProtectedRoute`), no de una llamada propia — así
 * comparte el mismo estado que cualquier hijo (p. ej. `ProfileForm`, que
 * puede invalidarlo con `refresh()` tras guardar).
 */
export function ProtectedLayout({ breadcrumbs, wide = false, overlayHeader = false, children }: ProtectedLayoutProps) {
  const { email, name, rol, avatarKey } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch("/api/accounts/logout", { method: "POST" });
    // A la portada, no al formulario de inicio de sesión: quien sale no tiene por qué querer volver a entrar.
    navigate("/", { replace: true });
  }

  return (
    // El pie, siempre al fondo de la pantalla: si iba justo después del contenido, saltaba cada vez que
    // llegaban datos (Lighthouse, 18 oct.). El contenido va en un bloque normal, no como hijo flex.
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Box sx={{ flexGrow: 1 }}>
        {/* name (RF-03) tiene prioridad sobre el email en cuanto existe — ver api/sesion.ts. */}
        <Header displayName={name ?? email} avatarKey={avatarKey} onLogout={handleLogout} isAdmin={rol === "admin"} overlay={overlayHeader} />
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} align="start" maxWidth={wide ? WIDE_PAGE_MAX_WIDTH : PAGE_MAX_WIDTH} /> : null}
        {children}
      </Box>
      {/* RF-30: en toda pantalla protegida, igual para todo el mundo. */}
      <HelpFooter />
    </Box>
  );
}
