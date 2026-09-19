import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export interface EstadoSesion {
  loading: boolean;
  authenticated: boolean;
  email?: string;
  /** `undefined` mientras carga o si el usuario todavía no configuró su perfil (RF-03). */
  name?: string;
  /** Rol de la sesión. Solo sirve para adaptar la interfaz: la autorización real la hace el servidor (ADM-01). */
  rol?: "usuario" | "premium" | "admin";
}

export interface SessionContextValue extends EstadoSesion {
  /**
   * Vuelve a consultar /api/accounts/session. Necesario porque el estado de sesión se
   * carga una vez al montar — sin esto, guardar el perfil (RF-03) no se
   * reflejaría en el Header hasta recargar la página o navegar fuera y
   * volver (bug real encontrado en pruebas manuales).
   */
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Única fuente de verdad de "quién ha iniciado sesión" para toda el área
 * protegida — ProtectedRoute la instala una vez por ruta; ProtectedLayout y
 * cualquier pantalla dentro (ProfileForm) leen del mismo contexto, así que
 * comparten una sola llamada a /api/accounts/session y pueden invalidarla entre sí.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>({ loading: true, authenticated: false });
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    fetch("/api/accounts/session")
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        if (montado.current) {
          setEstado({ loading: false, authenticated: !!datos.autenticado, email: datos.email, name: datos.name, rol: datos.autenticado ? (datos.rol ?? "usuario") : undefined });
        }
      })
      .catch(() => {
        if (montado.current) setEstado({ loading: false, authenticated: false });
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <SessionContext.Provider value={{ ...estado, refresh }}>{children}</SessionContext.Provider>;
}

/** Debe usarse dentro de <SessionProvider> — lo instala ProtectedRoute. */
// eslint-disable-next-line react-refresh/only-export-components -- hook de contexto, convención habitual junto a su Provider.
export function useSession(): SessionContextValue {
  const contexto = useContext(SessionContext);
  if (!contexto) {
    throw new Error("useSession debe usarse dentro de <SessionProvider> (ver ProtectedRoute)");
  }
  return contexto;
}
