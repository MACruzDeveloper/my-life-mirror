// Imports relativos, no alias (@shared/@modules): este archivo se alcanza
// desde api/*.ts, que Vercel bundlea por separado de Vite y no resuelve
// nuestros alias de tsconfig — ver AGENTS.md.
import type { Clock } from "#shared/domain/Clock.js";
import { SystemClock } from "./SystemClock.js";
import type { AuthProvider } from "#modules/accounts/domain/AuthProvider.js";
import { InMemoryAuthProvider } from "#modules/accounts/infrastructure/InMemoryAuthProvider.js";
import { SupabaseAuthProvider } from "#modules/accounts/infrastructure/SupabaseAuthProvider.js";
import { createRegisterUser } from "#modules/accounts/application/RegisterUser.js";
import { createLogIn } from "#modules/accounts/application/LogIn.js";
import { createDeleteAccount } from "#modules/accounts/application/DeleteAccount.js";
import { createExportUserData } from "#modules/accounts/application/ExportUserData.js";
import { createGenerateRecommendations } from "#modules/recommendations/application/GenerateRecommendations.js";
import { createListRecommendations } from "#modules/recommendations/application/ListRecommendations.js";
import { parseThreshold } from "#modules/recommendations/domain/recommendationCatalog.js";
import type { RecommendationRepository } from "#modules/recommendations/domain/RecommendationRepository.js";
import { InMemoryRecommendationRepository } from "#modules/recommendations/infrastructure/InMemoryRecommendationRepository.js";
import { SupabaseRecommendationRepository } from "#modules/recommendations/infrastructure/SupabaseRecommendationRepository.js";
import { createPersonalizeRecommendation } from "#modules/recommendations/application/PersonalizeRecommendation.js";
import type { IdeaReviewer, IdeaWriter } from "#modules/recommendations/domain/IdeaWriter.js";
import type { PersonalizedIdeaRepository } from "#modules/recommendations/domain/PersonalizedIdea.js";
import { FakeIdeaReviewer, FakeIdeaWriter } from "#modules/recommendations/infrastructure/FakeIdeaWriter.js";
import { InMemoryPersonalizedIdeaRepository } from "#modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository.js";
import { JsonIdeaTexts } from "#modules/recommendations/infrastructure/JsonIdeaTexts.js";
import { SupabasePersonalizedIdeaRepository } from "#modules/recommendations/infrastructure/SupabasePersonalizedIdeaRepository.js";
import { createSetAiIdeas } from "#modules/accounts/application/SetAiIdeas.js";
import { logger } from "./logger.js";
import { createAdminUserActions } from "#modules/accounts/application/AdminUserActions.js";
import type { AdminAuditRepository } from "#modules/accounts/domain/AdminAuditRepository.js";
import { InMemoryAdminAuditRepository } from "#modules/accounts/infrastructure/InMemoryAdminAuditRepository.js";
import { SupabaseAdminAuditRepository } from "#modules/accounts/infrastructure/SupabaseAdminAuditRepository.js";
import { createListUsers } from "#modules/accounts/application/ListUsers.js";
import { createVerifySession } from "#modules/accounts/application/VerifySession.js";
import { createRequestPasswordReset } from "#modules/accounts/application/RequestPasswordReset.js";
import { createResetPassword } from "#modules/accounts/application/ResetPassword.js";
import type { ConsentRepository } from "#modules/consent/domain/ConsentRepository.js";
import { InMemoryConsentRepository } from "#modules/consent/infrastructure/InMemoryConsentRepository.js";
import { SupabaseConsentRepository } from "#modules/consent/infrastructure/SupabaseConsentRepository.js";
import { createGrantConsent } from "#modules/consent/application/GrantConsent.js";
import { createCheckConsent } from "#modules/consent/application/CheckConsent.js";
import type { ProfileRepository } from "#modules/accounts/domain/ProfileRepository.js";
import { InMemoryProfileRepository } from "#modules/accounts/infrastructure/InMemoryProfileRepository.js";
import { SupabaseProfileRepository } from "#modules/accounts/infrastructure/SupabaseProfileRepository.js";
import { createUpdateProfile } from "#modules/accounts/application/UpdateProfile.js";
import { createGetProfile } from "#modules/accounts/application/GetProfile.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { InMemoryCategoryRepository } from "#modules/categories/infrastructure/InMemoryCategoryRepository.js";
import { SupabaseCategoryRepository } from "#modules/categories/infrastructure/SupabaseCategoryRepository.js";
import type { CategoryCatalogRepository } from "#modules/categories/domain/CategoryCatalogRepository.js";
import { InMemoryCategoryCatalogRepository } from "#modules/categories/infrastructure/InMemoryCategoryCatalogRepository.js";
import { SupabaseCategoryCatalogRepository } from "#modules/categories/infrastructure/SupabaseCategoryCatalogRepository.js";
import { createListCatalogLabels } from "#modules/categories/application/ListCatalogLabels.js";
import { createListCatalog } from "#modules/categories/application/ListCatalog.js";
import { createAddCatalogCategory } from "#modules/categories/application/AddCatalogCategory.js";
import { createRetireCatalogCategory } from "#modules/categories/application/RetireCatalogCategory.js";
import { createListCategories } from "#modules/categories/application/ListCategories.js";
import { createActivateCategory } from "#modules/categories/application/ActivateCategory.js";
import { createDeactivateCategory } from "#modules/categories/application/DeactivateCategory.js";
import { createSetCategoryExperience } from "#modules/categories/application/SetCategoryExperience.js";
import { createSetCategoryDifficulties } from "#modules/recommendations/application/SetCategoryDifficulties.js";
import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import { InMemoryAssessmentRepository } from "#modules/assessments/infrastructure/InMemoryAssessmentRepository.js";
import { SupabaseAssessmentRepository } from "#modules/assessments/infrastructure/SupabaseAssessmentRepository.js";
import { createRecordAssessments } from "#modules/assessments/application/RecordAssessments.js";
import { createGetAssessmentHistory } from "#modules/assessments/application/GetAssessmentHistory.js";
import { createGetLatestScores } from "#modules/assessments/application/GetLatestScores.js";

/**
 * Composition Root — ADR-03 apartado 3.4. Único lugar del sistema con permiso para
 * conocer implementaciones concretas de infraestructura y conectarlas a los
 * casos de uso. Lo usan las funciones de `api/`, nunca un componente de React
 * directamente (los casos de uso corren en el servidor, no en el navegador).
 */

export const ENVIRONMENTS = ["dev", "test", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

function detectEnvironment(): Environment {
  const value = process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev";
  return value === "test" || value === "production" ? value : "dev";
}

function supabaseCredentials(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — ver .env.example");
  }
  return { url, serviceRoleKey };
}

function createAuthProvider(environment: Environment): AuthProvider {
  // Sin sustituto en memoria razonable para autenticación completa en dev —
  // se usa el proyecto real de Supabase también ahí (ADR-06 apartado 1). Solo los
  // tests usan InMemoryAuthProvider.
  if (environment === "test") {
    return new InMemoryAuthProvider();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("Falta APP_URL — ver .env.example");
  }
  return new SupabaseAuthProvider(url, serviceRoleKey, `${appUrl}/restablecer-password`);
}

function createPersonalizedIdeaRepository(environment: Environment): PersonalizedIdeaRepository {
  if (environment === "test") {
    return new InMemoryPersonalizedIdeaRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabasePersonalizedIdeaRepository(url, serviceRoleKey);
}

/**
 * RF-40: quién escribe las ideas personalizadas, según `AI_IDEAS_PROVIDER`.
 * - `fake`: escritor determinista (desarrollo local y E2E).
 * - sin valor: función apagada (producción hasta RF-40b); la opción ni se ofrece.
 * - `anthropic`: llegará con RF-40b; hasta entonces, apagada con un aviso en el log.
 */
function createIdeaProvider(): { writer?: IdeaWriter; reviewer: IdeaReviewer } {
  const provider = process.env.AI_IDEAS_PROVIDER?.trim();
  if (provider === "fake") return { writer: new FakeIdeaWriter(), reviewer: new FakeIdeaReviewer() };
  if (provider) logger.warn("AI_IDEAS_PROVIDER desconocido o sin implementar: ideas con IA apagadas", { provider });
  return { reviewer: new FakeIdeaReviewer() };
}

/**
 * Persistencia real desde el principio (no en memoria, ni siquiera en dev):
 * este repositorio lo leen/escriben varias funciones serverless distintas
 * (api/accounts/register.ts, profile.ts, session.ts), que no comparten
 * memoria entre sí — un adaptador en memoria nunca vería los datos de otra
 * función. Solo los tests usan InMemoryProfileRepository (ver
 * supabase/migrations/0001_profiles.sql).
 */
function createProfileRepository(environment: Environment): ProfileRepository {
  if (environment === "test") {
    return new InMemoryProfileRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseProfileRepository(url, serviceRoleKey);
}

/**
 * Misma razón que ProfileRepository — ver supabase/migrations/0002_consentimientos.sql.
 * Ya tiene disparador real: `ActivateCategory` (RF-07) lo llama al activar
 * una categoría sensible.
 */
function createConsentRepository(environment: Environment): ConsentRepository {
  if (environment === "test") {
    return new InMemoryConsentRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseConsentRepository(url, serviceRoleKey);
}

/** Registro de auditoría de acciones de administración (ADM-03, supabase/migrations/0006_admin_audit_log.sql). */
function createAdminAuditRepository(environment: Environment): AdminAuditRepository {
  if (environment === "test") {
    return new InMemoryAdminAuditRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseAdminAuditRepository(url, serviceRoleKey);
}

/** Catálogo global de categorías (ADM-02, supabase/migrations/0005_category_catalog.sql). */
function createCategoryCatalogRepository(environment: Environment): CategoryCatalogRepository {
  if (environment === "test") {
    return new InMemoryCategoryCatalogRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseCategoryCatalogRepository(url, serviceRoleKey);
}

/**
 * Persistencia real desde el principio, sin pasar por en memoria en dev —
 * se escribe desde activar/desactivar y se lee desde listar, funciones
 * distintas de `api/` (ver supabase/migrations/0003_categories.sql y
 * 04_Almacenamiento_Datos.md apartado 5.1: no se repite el error de RF-03/RF-04).
 */
function createCategoryRepository(environment: Environment): CategoryRepository {
  if (environment === "test") {
    return new InMemoryCategoryRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseCategoryRepository(url, serviceRoleKey);
}

/**
 * Persistencia real desde el principio — se escribe desde un endpoint y lo
 * leerán otros (panel, recomendaciones), ver supabase/migrations/0004_assessments.sql.
 */
function createAssessmentRepository(environment: Environment): AssessmentRepository {
  if (environment === "test") {
    return new InMemoryAssessmentRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseAssessmentRepository(url, serviceRoleKey);
}

/** Recomendaciones (RF-18, supabase/migrations/0007_recommendations.sql): real desde el principio, como evaluaciones. */
function createRecommendationRepository(environment: Environment): RecommendationRepository {
  if (environment === "test") {
    return new InMemoryRecommendationRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseRecommendationRepository(url, serviceRoleKey);
}

/**
 * Todo lo que un caso de uso puede necesitar del exterior, inyectado desde
 * aquí. Crece módulo a módulo a medida que se implementan los repositorios
 * reales (ver docs/project-management/01_Backlog_MVP.md)
 * — nunca se instancia un adaptador directamente dentro de un caso de uso.
 */
export interface AppContext {
  environment: Environment;
  clock: Clock;
  authProvider: AuthProvider;
  registerUser: ReturnType<typeof createRegisterUser>;
  logIn: ReturnType<typeof createLogIn>;
  verifySession: ReturnType<typeof createVerifySession>;
  listUsers: ReturnType<typeof createListUsers>;
  adminUsers: ReturnType<typeof createAdminUserActions>;
  exportUserData: ReturnType<typeof createExportUserData>;
  deleteAccount: ReturnType<typeof createDeleteAccount>;
  requestPasswordReset: ReturnType<typeof createRequestPasswordReset>;
  resetPassword: ReturnType<typeof createResetPassword>;
  consentRepository: ConsentRepository;
  grantConsent: ReturnType<typeof createGrantConsent>;
  checkConsent: ReturnType<typeof createCheckConsent>;
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
  setCategoryExperience: ReturnType<typeof createSetCategoryExperience>;
  setCategoryDifficulties: ReturnType<typeof createSetCategoryDifficulties>;
  assessmentRepository: AssessmentRepository;
  recordAssessments: ReturnType<typeof createRecordAssessments>;
  getLatestScores: ReturnType<typeof createGetLatestScores>;
  getAssessmentHistory: ReturnType<typeof createGetAssessmentHistory>;
  recommendationRepository: RecommendationRepository;
  listRecommendations: ReturnType<typeof createListRecommendations>;
  /** RF-40: si hay un proveedor de IA configurado (la interfaz solo ofrece la opción entonces). */
  aiIdeasAvailable: boolean;
  personalizeRecommendation: ReturnType<typeof createPersonalizeRecommendation>;
  setAiIdeas: ReturnType<typeof createSetAiIdeas>;
}

export function createAppContext(environment: Environment = detectEnvironment()): AppContext {
  const authProvider = createAuthProvider(environment);
  const clock = new SystemClock();
  const consentRepository = createConsentRepository(environment);
  const profileRepository = createProfileRepository(environment);
  const updateProfile = createUpdateProfile(profileRepository);
  const categoryRepository = createCategoryRepository(environment);
  const categoryCatalogRepository = createCategoryCatalogRepository(environment);
  const checkConsent = createCheckConsent(consentRepository);
  const assessmentRepository = createAssessmentRepository(environment);
  const registerUser = createRegisterUser(authProvider, updateProfile);
  const recommendationRepository = createRecommendationRepository(environment);
  const personalizedIdeaRepository = createPersonalizedIdeaRepository(environment);
  const ideaProvider = createIdeaProvider();
  // Umbral configurable (RF-18): variable de entorno, con el 5 por defecto si falta o no es válida.
  const generateRecommendations = createGenerateRecommendations({
    recommendationRepository,
    categoryRepository,
    catalog: categoryCatalogRepository,
    clock,
    threshold: parseThreshold(process.env.RECOMMENDATION_THRESHOLD),
  });

  return {
    environment,
    clock,
    authProvider,
    // registerUser depende de updateProfile (guarda el nombre como perfil
    // inicial en la misma operación, RF-03) — de ahí construirlo después.
    registerUser,
    logIn: createLogIn(authProvider),
    verifySession: createVerifySession(authProvider),
    listUsers: createListUsers(authProvider, profileRepository),
    adminUsers: createAdminUserActions({
      authProvider,
      profileRepository,
      categoryRepository,
      consentRepository,
      assessmentRepository,
      recommendationRepository,
      personalizedIdeaRepository,
      auditRepository: createAdminAuditRepository(environment),
      registerUser,
      updateProfile,
      clock,
    }),
    exportUserData: createExportUserData({ profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, clock }),
    deleteAccount: createDeleteAccount({ authProvider, profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository }),
    requestPasswordReset: createRequestPasswordReset(authProvider),
    resetPassword: createResetPassword(authProvider),
    consentRepository,
    grantConsent: createGrantConsent(consentRepository, clock),
    checkConsent,
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
    // activateCategory depende de checkConsent (RF-04 extiende a RF-07 para categorías sensibles).
    activateCategory: createActivateCategory(categoryRepository, checkConsent, categoryCatalogRepository),
    deactivateCategory: createDeactivateCategory(categoryRepository),
    setCategoryExperience: createSetCategoryExperience(categoryRepository, categoryCatalogRepository),
    setCategoryDifficulties: createSetCategoryDifficulties(categoryRepository, categoryCatalogRepository),
    assessmentRepository,
    // Las recomendaciones son secundarias: un fallo se registra pero nunca deshace el guardado de la entrevista.
    recordAssessments: createRecordAssessments(assessmentRepository, categoryRepository, clock, async (userId, saved) => {
      try {
        await generateRecommendations(userId, saved);
      } catch (error) {
        logger.error("No se pudieron generar las recomendaciones (el guardado sigue siendo válido)", error, { userId });
      }
    }),
    getLatestScores: createGetLatestScores(assessmentRepository, categoryRepository),
    getAssessmentHistory: createGetAssessmentHistory(assessmentRepository, categoryRepository),
    recommendationRepository,
    listRecommendations: createListRecommendations({ recommendationRepository, categoryRepository, assessmentRepository }),
    aiIdeasAvailable: ideaProvider.writer !== undefined,
    personalizeRecommendation: createPersonalizeRecommendation({
      recommendationRepository,
      categoryRepository,
      catalog: categoryCatalogRepository,
      assessmentRepository,
      profileRepository,
      personalizedIdeaRepository,
      ideaTexts: new JsonIdeaTexts(),
      writer: ideaProvider.writer,
      reviewer: ideaProvider.reviewer,
      clock,
      report: (reason, error) => logger.warn("Idea personalizada descartada: se muestra el texto curado", { reason, ...(error ? { error: String(error) } : {}) }),
    }),
    setAiIdeas: createSetAiIdeas({ profileRepository, personalizedIdeaRepository, clock }),
  };
}

let currentContext: AppContext | undefined;

/** Devuelve el AppContext del proceso, creándolo una sola vez. */
export function getAppContext(): AppContext {
  if (!currentContext) {
    currentContext = createAppContext();
  }
  return currentContext;
}
