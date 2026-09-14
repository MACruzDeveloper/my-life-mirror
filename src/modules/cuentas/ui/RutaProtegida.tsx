import type { ReactNode } from "react";
import { Navigate } from "react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useSesion } from "./useSesion";

/** Envoltura de ruta — RF-39. Redirige a /login si no hay sesión, según useSesion (ADR-06). */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { cargando, autenticado } = useSesion();

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
