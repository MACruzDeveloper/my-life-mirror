import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export interface SessionState {
  loading: boolean;
  authenticated: boolean;
  email?: string;
  /** `undefined` mientras carga o si el usuario todavía no configuró su perfil (RF-03). */
  name?: string;
  /** RF-26: clave del avatar elegido, si lo hay. */
  avatarKey?: string;
  /** Rol de la sesión. Solo sirve para adaptar la interfaz: la autorización real la hace el servidor (ADM-01). */
  rol?: "usuario" | "premium" | "admin";
  /** RF-40: si este despliegue tiene un proveedor de IA (sin él, la opción ni se ofrece). */
  aiIdeasAvailable?: boolean;
}

export interface SessionContextValue extends SessionState {
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
  const [formState, setFormState] = useState<SessionState>({ loading: true, authenticated: false });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    fetch("/api/accounts/session")
      .then((response) => response.json())
      .then((data) => {
        if (mounted.current) {
          setFormState({ loading: false, authenticated: !!data.autenticado, email: data.email, name: data.name, avatarKey: data.avatarKey, rol: data.autenticado ? (data.rol ?? "usuario") : undefined, aiIdeasAvailable: data.aiIdeasAvailable === true });
        }
      })
      .catch(() => {
        if (mounted.current) setFormState({ loading: false, authenticated: false });
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <SessionContext.Provider value={{ ...formState, refresh }}>{children}</SessionContext.Provider>;
}

/** Debe usarse dentro de <SessionProvider> — lo instala ProtectedRoute. */
// eslint-disable-next-line react-refresh/only-export-components -- hook de contexto, convención habitual junto a su Provider.
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession debe usarse dentro de <SessionProvider> (ver ProtectedRoute)");
  }
  return context;
}

/** Como `useSession` pero sin lanzar fuera de un `SessionProvider` (pantallas que solo la usan para pulir la interfaz). */
// eslint-disable-next-line react-refresh/only-export-components -- hook de contexto, convención habitual junto a su Provider.
export function useOptionalSession(): SessionContextValue | undefined {
  return useContext(SessionContext);
}
