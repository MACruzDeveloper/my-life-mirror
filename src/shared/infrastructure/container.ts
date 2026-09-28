// Imports relativos, no alias (@shared/@modules): este archivo se alcanza
// desde api/*.ts, que Vercel bundlea por separado de Vite y no resuelve
// nuestros alias de tsconfig — ver AGENTS.md.
import type { Clock } from "../domain/Clock.js";
import { SystemClock } from "./SystemClock.js";
import type { AuthProvider } from "../../modules/cuentas/domain/AuthProvider.js";
import { InMemoryAuthProvider } from "../../modules/cuentas/infrastructure/InMemoryAuthProvider.js";
import { SupabaseAuthProvider } from "../../modules/cuentas/infrastructure/SupabaseAuthProvider.js";
import { createRegisterUser } from "../../modules/cuentas/application/RegisterUser.js";
import { crearIniciarSesion } from "../../modules/cuentas/application/IniciarSesion.js";
import { createDeleteAccount } from "../../modules/cuentas/application/DeleteAccount.js";
import { createExportUserData } from "../../modules/cuentas/application/ExportUserData.js";
import { createGenerateRecommendations } from "../../modules/recommendations/application/GenerateRecommendations.js";
import { createListRecommendations } from "../../modules/recommendations/application/ListRecommendations.js";
import { parseThreshold } from "../../modules/recommendations/domain/recommendationCatalog.js";
import type { RecommendationRepository } from "../../modules/recommendations/domain/RecommendationRepository.js";
import { InMemoryRecommendationRepository } from "../../modules/recommendations/infrastructure/InMemoryRecommendationRepository.js";
import { SupabaseRecommendationRepository } from "../../modules/recommendations/infrastructure/SupabaseRecommendationRepository.js";
import { logger } from "./logger.js";
import { createAdminUserActions } from "../../modules/cuentas/application/AdminUserActions.js";
import type { AdminAuditRepository } from "../../modules/cuentas/domain/AdminAuditRepository.js";
import { InMemoryAdminAuditRepository } from "../../modules/cuentas/infrastructure/InMemoryAdminAuditRepository.js";
import { SupabaseAdminAuditRepository } from "../../modules/cuentas/infrastructure/SupabaseAdminAuditRepository.js";
import { createListUsers } from "../../modules/cuentas/application/ListUsers.js";
import { crearVerificarSesion } from "../../modules/cuentas/application/VerificarSesion.js";
import { crearSolicitarRecuperacion } from "../../modules/cuentas/application/SolicitarRecuperacion.js";
import { crearRestablecerPassword } from "../../modules/cuentas/application/RestablecerPassword.js";
import type { ConsentimientoRepository } from "../../modules/consentimiento/domain/ConsentimientoRepository.js";
import { InMemoryConsentimientoRepository } from "../../modules/consentimiento/infrastructure/InMemoryConsentimientoRepository.js";
import { SupabaseConsentimientoRepository } from "../../modules/consentimiento/infrastructure/SupabaseConsentimientoRepository.js";
import { crearOtorgarConsentimiento } from "../../modules/consentimiento/application/OtorgarConsentimiento.js";
import { crearVerificarConsentimiento } from "../../modules/consentimiento/application/VerificarConsentimiento.js";
import type { ProfileRepository } from "../../modules/cuentas/domain/ProfileRepository.js";
import { InMemoryProfileRepository } from "../../modules/cuentas/infrastructure/InMemoryProfileRepository.js";
import { SupabaseProfileRepository } from "../../modules/cuentas/infrastructure/SupabaseProfileRepository.js";
import { createUpdateProfile } from "../../modules/cuentas/application/UpdateProfile.js";
import { createGetProfile } from "../../modules/cuentas/application/GetProfile.js";
import type { CategoryRepository } from "../../modules/categories/domain/CategoryRepository.js";
import { InMemoryCategoryRepository } from "../../modules/categories/infrastructure/InMemoryCategoryRepository.js";
import { SupabaseCategoryRepository } from "../../modules/categories/infrastructure/SupabaseCategoryRepository.js";
import type { CategoryCatalogRepository } from "../../modules/categories/domain/CategoryCatalogRepository.js";
import { InMemoryCategoryCatalogRepository } from "../../modules/categories/infrastructure/InMemoryCategoryCatalogRepository.js";
import { SupabaseCategoryCatalogRepository } from "../../modules/categories/infrastructure/SupabaseCategoryCatalogRepository.js";
import { createListCatalogLabels } from "../../modules/categories/application/ListCatalogLabels.js";
import { createListCatalog } from "../../modules/categories/application/ListCatalog.js";
import { createAddCatalogCategory } from "../../modules/categories/application/AddCatalogCategory.js";
import { createRetireCatalogCategory } from "../../modules/categories/application/RetireCatalogCategory.js";
import { createListCategories } from "../../modules/categories/application/ListCategories.js";
import { createActivateCategory } from "../../modules/categories/application/ActivateCategory.js";
import { createDeactivateCategory } from "../../modules/categories/application/DeactivateCategory.js";
import type { AssessmentRepository } from "../../modules/assessments/domain/AssessmentRepository.js";
import { InMemoryAssessmentRepository } from "../../modules/assessments/infrastructure/InMemoryAssessmentRepository.js";
import { SupabaseAssessmentRepository } from "../../modules/assessments/infrastructure/SupabaseAssessmentRepository.js";
import { createRecordAssessments } from "../../modules/assessments/application/RecordAssessments.js";
import { createGetAssessmentHistory } from "../../modules/assessments/application/GetAssessmentHistory.js";
import { createGetLatestScores } from "../../modules/assessments/application/GetLatestScores.js";

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

/** Registro de auditoría de acciones de administración (ADM-03, supabase/migrations/0006_admin_audit_log.sql). */
function crearAdminAuditRepository(entorno: Entorno): AdminAuditRepository {
  if (entorno === "test") {
    return new InMemoryAdminAuditRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseAdminAuditRepository(url, serviceRoleKey);
}

/** Catálogo global de categorías (ADM-02, supabase/migrations/0005_category_catalog.sql). */
function crearCategoryCatalogRepository(entorno: Entorno): CategoryCatalogRepository {
  if (entorno === "test") {
    return new InMemoryCategoryCatalogRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseCategoryCatalogRepository(url, serviceRoleKey);
}

/**
 * Persistencia real desde el principio, sin pasar por en memoria en dev —
 * se escribe desde activar/desactivar y se lee desde listar, funciones
 * distintas de `api/` (ver supabase/migrations/0003_categories.sql y
 * 04_Almacenamiento_Datos.md §5.1: no se repite el error de RF-03/RF-04).
 */
function crearCategoryRepository(entorno: Entorno): CategoryRepository {
  if (entorno === "test") {
    return new InMemoryCategoryRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseCategoryRepository(url, serviceRoleKey);
}

/**
 * Persistencia real desde el principio — se escribe desde un endpoint y lo
 * leerán otros (panel, recomendaciones), ver supabase/migrations/0004_assessments.sql.
 */
function crearAssessmentRepository(entorno: Entorno): AssessmentRepository {
  if (entorno === "test") {
    return new InMemoryAssessmentRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseAssessmentRepository(url, serviceRoleKey);
}

/** Recomendaciones (RF-18, supabase/migrations/0007_recommendations.sql): real desde el principio, como evaluaciones. */
function crearRecommendationRepository(entorno: Entorno): RecommendationRepository {
  if (entorno === "test") {
    return new InMemoryRecommendationRepository();
  }
  const { url, serviceRoleKey } = credencialesSupabase();
  return new SupabaseRecommendationRepository(url, serviceRoleKey);
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
  listUsers: ReturnType<typeof createListUsers>;
  adminUsers: ReturnType<typeof createAdminUserActions>;
  exportUserData: ReturnType<typeof createExportUserData>;
  deleteAccount: ReturnType<typeof createDeleteAccount>;
  solicitarRecuperacion: ReturnType<typeof crearSolicitarRecuperacion>;
  restablecerPassword: ReturnType<typeof crearRestablecerPassword>;
  consentimientoRepository: ConsentimientoRepository;
  otorgarConsentimiento: ReturnType<typeof crearOtorgarConsentimiento>;
  verificarConsentimiento: ReturnType<typeof crearVerificarConsentimiento>;
  profileRepository: ProfileRepository;
  updateProfile: ReturnType<typeof createUpdateProfile>;
  getProfile: ReturnType<typeof createGetProfile>;
  categoryRepository: CategoryRepository;
  categoryCatalogRepository: CategoryCatalogRepository;
  listCatalog: ReturnType<typeof createListCatalog>;
  listCatalogLabels: ReturnType<typeof createListCatalogLabels>;
  addCatalogCategory: ReturnType<typeof createAddCatalogCategory>;
  retireCatalogCategory: ReturnType<typeof createRetireCatalogCategory>;
  listCategories: ReturnType<typeof createListCategories>;
  activateCategory: ReturnType<typeof createActivateCategory>;
  deactivateCategory: ReturnType<typeof createDeactivateCategory>;
  assessmentRepository: AssessmentRepository;
  recordAssessments: ReturnType<typeof createRecordAssessments>;
  getLatestScores: ReturnType<typeof createGetLatestScores>;
  getAssessmentHistory: ReturnType<typeof createGetAssessmentHistory>;
  recommendationRepository: RecommendationRepository;
  listRecommendations: ReturnType<typeof createListRecommendations>;
}

export function crearAppContext(entorno: Entorno = detectarEntorno()): AppContext {
  const authProvider = crearAuthProvider(entorno);
  const clock = new SystemClock();
  const consentimientoRepository = crearConsentimientoRepository(entorno);
  const profileRepository = crearProfileRepository(entorno);
  const updateProfile = createUpdateProfile(profileRepository);
  const categoryRepository = crearCategoryRepository(entorno);
  const categoryCatalogRepository = crearCategoryCatalogRepository(entorno);
  const verificarConsentimiento = crearVerificarConsentimiento(consentimientoRepository);
  const assessmentRepository = crearAssessmentRepository(entorno);
  const registerUser = createRegisterUser(authProvider, updateProfile);
  const recommendationRepository = crearRecommendationRepository(entorno);
  // Umbral configurable (RF-18): variable de entorno, con el 5 por defecto si falta o no es válida.
  const generateRecommendations = createGenerateRecommendations({
    recommendationRepository,
    categoryRepository,
    catalog: categoryCatalogRepository,
    clock,
    threshold: parseThreshold(process.env.RECOMMENDATION_THRESHOLD),
  });

  return {
    entorno,
    clock,
    authProvider,
    // registerUser depende de updateProfile (guarda el nombre como perfil
    // inicial en la misma operación, RF-03) — de ahí construirlo después.
    registerUser,
    iniciarSesion: crearIniciarSesion(authProvider),
    verificarSesion: crearVerificarSesion(authProvider),
    listUsers: createListUsers(authProvider, profileRepository),
    adminUsers: createAdminUserActions({
      authProvider,
      profileRepository,
      categoryRepository,
      consentimientoRepository,
      assessmentRepository,
      recommendationRepository,
      auditRepository: crearAdminAuditRepository(entorno),
      registerUser,
      updateProfile,
      clock,
    }),
    exportUserData: createExportUserData({ profileRepository, categoryRepository, consentimientoRepository, assessmentRepository, recommendationRepository, clock }),
    deleteAccount: createDeleteAccount({ authProvider, profileRepository, categoryRepository, consentimientoRepository, assessmentRepository, recommendationRepository }),
    solicitarRecuperacion: crearSolicitarRecuperacion(authProvider),
    restablecerPassword: crearRestablecerPassword(authProvider),
    consentimientoRepository,
    otorgarConsentimiento: crearOtorgarConsentimiento(consentimientoRepository, clock),
    verificarConsentimiento,
    profileRepository,
    updateProfile,
    getProfile: createGetProfile(profileRepository),
    categoryRepository,
    categoryCatalogRepository,
    listCatalog: createListCatalog(categoryCatalogRepository),
    listCatalogLabels: createListCatalogLabels(categoryCatalogRepository),
    addCatalogCategory: createAddCatalogCategory(categoryCatalogRepository),
    retireCatalogCategory: createRetireCatalogCategory(categoryCatalogRepository, categoryRepository, () => clock.now()),
    listCategories: createListCategories(categoryRepository, categoryCatalogRepository),
    // activateCategory depende de verificarConsentimiento (RF-04 extiende a RF-07 para categorías sensibles).
    activateCategory: createActivateCategory(categoryRepository, verificarConsentimiento, categoryCatalogRepository),
    deactivateCategory: createDeactivateCategory(categoryRepository),
    assessmentRepository,
    // Las recomendaciones son secundarias: un fallo se registra pero nunca deshace el guardado de la entrevista.
    recordAssessments: createRecordAssessments(assessmentRepository, categoryRepository, clock, async (userId, guardadas) => {
      try {
        await generateRecommendations(userId, guardadas);
      } catch (error) {
        logger.error("No se pudieron generar las recomendaciones (el guardado sigue siendo válido)", error, { usuario: userId });
      }
    }),
    getLatestScores: createGetLatestScores(assessmentRepository, categoryRepository),
    getAssessmentHistory: createGetAssessmentHistory(assessmentRepository, categoryRepository),
    recommendationRepository,
    listRecommendations: createListRecommendations({ recommendationRepository, categoryRepository, assessmentRepository }),
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
