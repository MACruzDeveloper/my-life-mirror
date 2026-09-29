import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { SessionProvider, useSession } from "@shared/ui/context/SessionContext";

function Guard({ children }: { children: ReactNode }) {
  const { loading, authenticated } = useSession();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Envoltura de ruta — RF-39. Instala el `SessionProvider` (fuente única de
 * la sesión para toda la ruta protegida — `ProtectedLayout` y sus hijos, p.
 * ej. `ProfileForm`, leen del mismo contexto) y redirige a /login si no hay
 * sesión, según ese contexto (ADR-06). Se usa como ruta de diseño (sin
 * `children`, renderiza `<Outlet />`) envolviendo todas las pantallas
 * protegidas: así el proveedor NO se desmonta al navegar entre ellas y la
 * sesión se consulta una sola vez, no en cada cambio de pantalla.
 */
export function ProtectedRoute({ children }: { children?: ReactNode }) {
  return (
    <SessionProvider>
      <Guard>{children ?? <Outlet />}</Guard>
    </SessionProvider>
  );
}
