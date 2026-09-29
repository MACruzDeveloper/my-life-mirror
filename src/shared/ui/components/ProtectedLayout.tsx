import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";
import { Header } from "./Header";
import { useSession } from "../context/SessionContext";

export interface ProtectedLayoutProps {
  /**
   * Sin migas: pantallas de nivel superior dentro del área autenticada (Home).
   * Tipo `MigaDePan` (de Breadcrumbs.tsx) sin traducir todavía — pendiente,
   * ver AGENTS.md sobre nombres en inglés.
   */
  breadcrumbs?: BreadcrumbItem[];
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
export function ProtectedLayout({ breadcrumbs, children }: ProtectedLayoutProps) {
  const { email, name, rol } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch("/api/accounts/logout", { method: "POST" });
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* name (RF-03) tiene prioridad sobre el email en cuanto existe — ver api/sesion.ts. */}
      <Header displayName={name ?? email} onLogout={handleLogout} isAdmin={rol === "admin"} />
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      {children}
    </>
  );
}
