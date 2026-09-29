import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@shared/ui/context/SessionContext";

/**
 * Comodidad de interfaz, no seguridad (ADM-01): redirige a quien no es admin
 * para que no vea una página vacía. Aunque se saltara, `/api/admin/*`
 * responde 403 sin datos. Va dentro de `ProtectedRoute` (necesita la sesión).
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, rol } = useSession();
  if (loading) return null;
  return rol === "admin" ? <>{children}</> : <Navigate to="/inicio" replace />;
}
