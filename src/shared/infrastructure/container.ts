// Imports relativos, no alias (@shared/@modules): este archivo se alcanza
// desde api/*.ts, que Vercel bundlea por separado de Vite y no resuelve
// nuestros alias de tsconfig — ver AGENTS.md.
import type { Clock } from "../domain/Clock";
import { SystemClock } from "./SystemClock";
import type { AuthProvider } from "../../modules/cuentas/domain/AuthProvider";
import { InMemoryAuthProvider } from "../../modules/cuentas/infrastructure/InMemoryAuthProvider";
import { SupabaseAuthProvider } from "../../modules/cuentas/infrastructure/SupabaseAuthProvider";
import { createRegisterUser } from "../../modules/cuentas/application/RegisterUser";
import { crearIniciarSesion } from "../../modules/cuentas/application/IniciarSesion";
import { crearVerificarSesion } from "../../modules/cuentas/application/VerificarSesion";
import { crearSolicitarRecuperacion } from "../../modules/cuentas/application/SolicitarRecuperacion";
import { crearRestablecerPassword } from "../../modules/cuentas/application/RestablecerPassword";
import type { ConsentimientoRepository } from "../../modules/consentimiento/domain/ConsentimientoRepository";
import { InMemoryConsentimientoRepository } from "../../modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import { SupabaseConsentimientoRepository } from "../../modules/consentimiento/infrastructure/SupabaseConsentimientoRepository";
import { crearOtorgarConsentimiento } from "../../modules/consentimiento/application/OtorgarConsentimiento";
import { crearVerificarConsentimiento } from "../../modules/consentimiento/application/VerificarConsentimiento";
import type { ProfileRepository } from "../../modules/cuentas/domain/ProfileRepository";
import { InMemoryProfileRepository } from "../../modules/cuentas/infrastructure/InMemoryProfileRepository";
import { SupabaseProfileRepository } from "../../modules/cuentas/infrastructure/SupabaseProfileRepository";
import { createUpdateProfile } from "../../modules/cuentas/application/UpdateProfile";
import { createGetProfile } from "../../modules/cuentas/application/GetProfile";
import type { CategoryRepository } from "../../modules/categories/domain/CategoryRepository";
import { InMemoryCategoryRepository } from "../../modules/categories/infrastructure/InMemoryCategoryRepository";
import { SupabaseCategoryRepository } from "../../modules/categories/infrastructure/SupabaseCategoryRepository";
import { createListCategories } from "../../modules/categories/application/ListCategories";
import { createActivateCategory } from "../../modules/categories/application/ActivateCategory";
import { createDeactivateCategory } from "../../modules/categories/application/DeactivateCategory";

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

function credencialesSupabase(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — ver .env.example");
  }
  return { url, serviceRoleKey };
}

function crearAuthProvider(entorno: Entorno): AuthProvider {
  // Sin sustituto en memoria razonable para autenticación completa en dev —
  // se usa el proyecto real de Supabase también ahí (ADR-06 §1). Solo los
  // tests usan InMemoryAuthProvider.
  if (entorno === "test") {
    return new InMemoryAuthProvider();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("Falta APP_URL — ver .env.example");
  }
  return new SupabaseAuthProvider(url, serviceRoleKey, `${appUrl}/restablecer-password`);
}

/**
 * Persistencia real desde el principio (no en memoria, ni siquiera en dev):
 * este repositorio lo leen/escriben varias funciones serverless distintas
 * (api/accounts/register.ts, profile.ts, session.ts), que no comparten
 * memoria entre sí — un adaptador en memoria nunca vería los datos de otra
 * función. Solo los tests usan InMemoryProfileRepository (ver
 * supabase/migrations/0001_profiles.sql).
 */
function crearProfileRepository(entorno: Entorno): ProfileRepository {
  if (entorno === "test") {
    return new InMemoryProfileRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseProfileRepository(url, serviceRoleKey);
}

/**
 * Misma razón que ProfileRepository — ver supabase/migrations/0002_consentimientos.sql.
 * Ya tiene disparador real: `ActivateCategory` (RF-07) lo llama al activar
 * una categoría sensible.
 */
function crearConsentimientoRepository(entorno: Entorno): ConsentimientoRepository {
  if (entorno === "test") {
    return new InMemoryConsentimientoRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseConsentimientoRepository(url, serviceRoleKey);
}

/**
 * Persistencia real desde el principio, sin pasar por en memoria en dev —
 * se escribe desde activar/desactivar y se lee desde listar, funciones
 * distintas de `api/` (ver supabase/migrations/0003_categories.sql y
 * 04_Almacenamiento_Datos.md §7bis: no se repite el error de RF-03/RF-04).
 */
function crearCategoryRepository(entorno: Entorno): CategoryRepository {
  if (entorno === "test") {
    return new InMemoryCategoryRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseCategoryRepository(url, serviceRoleKey);
}

/**
 * Todo lo que un caso de uso puede necesitar del exterior, inyectado desde
 * aquí. Crece módulo a módulo a medida que se implementan los repositorios
 * reales (ver docs/project-management/01_Backlog_MVP.md)
 * — nunca se instancia un adaptador directamente dentro de un caso de uso.
 */
export interface AppContext {
  entorno: Entorno;
  clock: Clock;
  authProvider: AuthProvider;
  registerUser: ReturnType<typeof createRegisterUser>;
  iniciarSesion: ReturnType<typeof crearIniciarSesion>;
  verificarSesion: ReturnType<typeof crearVerificarSesion>;
  solicitarRecuperacion: ReturnType<typeof crearSolicitarRecuperacion>;
  restablecerPassword: ReturnType<typeof crearRestablecerPassword>;
  consentimientoRepository: ConsentimientoRepository;
  otorgarConsentimiento: ReturnType<typeof crearOtorgarConsentimiento>;
  verificarConsentimiento: ReturnType<typeof crearVerificarConsentimiento>;
  profileRepository: ProfileRepository;
  updateProfile: ReturnType<typeof createUpdateProfile>;
  getProfile: ReturnType<typeof createGetProfile>;
  categoryRepository: CategoryRepository;
  listCategories: ReturnType<typeof createListCategories>;
  activateCategory: ReturnType<typeof createActivateCategory>;
  deactivateCategory: ReturnType<typeof createDeactivateCategory>;
  // Próximos, según se tiren del tablero: evaluacionRepository...
}

export function crearAppContext(entorno: Entorno = detectarEntorno()): AppContext {
  const authProvider = crearAuthProvider(entorno);
  const clock = new SystemClock();
  const consentimientoRepository = crearConsentimientoRepository(entorno);
  const profileRepository = crearProfileRepository(entorno);
  const updateProfile = createUpdateProfile(profileRepository);
  const categoryRepository = crearCategoryRepository(entorno);
  const verificarConsentimiento = crearVerificarConsentimiento(consentimientoRepository);

  return {
    entorno,
    clock,
    authProvider,
    // registerUser depende de updateProfile (guarda el nombre como perfil
    // inicial en la misma operación, RF-03) — de ahí construirlo después.
    registerUser: createRegisterUser(authProvider, updateProfile),
    iniciarSesion: crearIniciarSesion(authProvider),
    verificarSesion: crearVerificarSesion(authProvider),
    solicitarRecuperacion: crearSolicitarRecuperacion(authProvider),
    restablecerPassword: crearRestablecerPassword(authProvider),
    consentimientoRepository,
    otorgarConsentimiento: crearOtorgarConsentimiento(consentimientoRepository, clock),
    verificarConsentimiento,
    profileRepository,
    updateProfile,
    getProfile: createGetProfile(profileRepository),
    categoryRepository,
    listCategories: createListCategories(categoryRepository),
    // activateCategory depende de verificarConsentimiento (RF-04 extiende a RF-07 para categorías sensibles).
    activateCategory: createActivateCategory(categoryRepository, verificarConsentimiento),
    deactivateCategory: createDeactivateCategory(categoryRepository),
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
