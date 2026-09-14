// Imports relativos, no alias (@shared/@modules): este archivo se alcanza
// desde api/*.ts, que Vercel bundlea por separado de Vite y no resuelve
// nuestros alias de tsconfig — ver AGENTS.md.
import type { Clock } from "../domain/Clock";
import { SystemClock } from "./SystemClock";
import type { AuthProvider } from "../../modules/cuentas/domain/AuthProvider";
import { InMemoryAuthProvider } from "../../modules/cuentas/infrastructure/InMemoryAuthProvider";
import { SupabaseAuthProvider } from "../../modules/cuentas/infrastructure/SupabaseAuthProvider";
import { crearRegistrarUsuario } from "../../modules/cuentas/application/RegistrarUsuario";
import { crearIniciarSesion } from "../../modules/cuentas/application/IniciarSesion";
import { crearVerificarSesion } from "../../modules/cuentas/application/VerificarSesion";
import { crearSolicitarRecuperacion } from "../../modules/cuentas/application/SolicitarRecuperacion";
import { crearRestablecerPassword } from "../../modules/cuentas/application/RestablecerPassword";

/**
 * Composition Root — ADR-03 §3.4. Único lugar del sistema con permiso para
 * conocer implementaciones concretas de infraestructura y conectarlas a los
 * casos de uso. Lo usan las funciones de `api/`, nunca un componente de React
 * directamente (los casos de uso corren en el servidor, no en el navegador).
 */

export type Entorno = "dev" | "test" | "production";

function detectarEntorno(): Entorno {
  const valor = process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev";
  return valor === "test" || valor === "production" ? valor : "dev";
}

function crearAuthProvider(entorno: Entorno): AuthProvider {
  // Sin sustituto en memoria razonable para autenticación completa en dev —
  // se usa el proyecto real de Supabase también ahí (ADR-06 §1). Solo los
  // tests usan InMemoryAuthProvider.
  if (entorno === "test") {
    return new InMemoryAuthProvider();
  }
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL;
  if (!url || !serviceRoleKey || !appUrl) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / APP_URL — ver .env.example");
  }
  return new SupabaseAuthProvider(url, serviceRoleKey, `${appUrl}/restablecer-password`);
}

/**
 * Todo lo que un caso de uso puede necesitar del exterior, inyectado desde
 * aquí. Crece módulo a módulo a medida que se implementan los repositorios
 * reales (ver Sprint 1 en adelante, docs/project-management/01_Backlog_MVP.md)
 * — nunca se instancia un adaptador directamente dentro de un caso de uso.
 */
export interface AppContext {
  entorno: Entorno;
  clock: Clock;
  authProvider: AuthProvider;
  registrarUsuario: ReturnType<typeof crearRegistrarUsuario>;
  iniciarSesion: ReturnType<typeof crearIniciarSesion>;
  verificarSesion: ReturnType<typeof crearVerificarSesion>;
  solicitarRecuperacion: ReturnType<typeof crearSolicitarRecuperacion>;
  restablecerPassword: ReturnType<typeof crearRestablecerPassword>;
  // Próximos, según avancen los sprints: categoriaRepository, evaluacionRepository...
}

export function crearAppContext(entorno: Entorno = detectarEntorno()): AppContext {
  const authProvider = crearAuthProvider(entorno);

  return {
    entorno,
    clock: new SystemClock(),
    authProvider,
    registrarUsuario: crearRegistrarUsuario(authProvider),
    iniciarSesion: crearIniciarSesion(authProvider),
    verificarSesion: crearVerificarSesion(authProvider),
    solicitarRecuperacion: crearSolicitarRecuperacion(authProvider),
    restablecerPassword: crearRestablecerPassword(authProvider),
  };
}

let contextoActual: AppContext | undefined;

/** Devuelve el AppContext del proceso, creándolo una sola vez. */
export function obtenerAppContext(): AppContext {
  if (!contextoActual) {
    contextoActual = crearAppContext();
  }
  return contextoActual;
}
