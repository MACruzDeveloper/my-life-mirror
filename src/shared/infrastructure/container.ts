// Imports relativos, no alias (@shared/@modules): este archivo se alcanza
// desde api/*.ts, que Vercel bundlea por separado de Vite y no resuelve
// nuestros alias de tsconfig — ver AGENTS.md.
import type { Clock } from "#shared/domain/Clock.js";
import { SystemClock } from "./SystemClock.js";
import type { AuthProvider } from "#modules/accounts/domain/AuthProvider.js";
import { InMemoryAuthProvider } from "#modules/accounts/infrastructure/InMemoryAuthProvider.js";
import { SupabaseAuthProvider } from "#modules/accounts/infrastructure/SupabaseAuthProvider.js";
import { resetPasswordUrl } from "#modules/accounts/infrastructure/resetPasswordUrl.js";
import { createRegisterUser } from "#modules/accounts/application/RegisterUser.js";
import { createLogIn } from "#modules/accounts/application/LogIn.js";
import { createDeleteAccount } from "#modules/accounts/application/DeleteAccount.js";
import { createEraseUser } from "#modules/accounts/application/EraseUser.js";
import { createExportUserData } from "#modules/accounts/application/ExportUserData.js";
import { createGenerateRecommendations } from "#modules/recommendations/application/GenerateRecommendations.js";
import { createListRecommendations } from "#modules/recommendations/application/ListRecommendations.js";
import { parseThreshold } from "#modules/recommendations/domain/recommendationCatalog.js";
import type { RecommendationRepository } from "#modules/recommendations/domain/RecommendationRepository.js";
import { InMemoryRecommendationRepository } from "#modules/recommendations/infrastructure/InMemoryRecommendationRepository.js";
import { SupabaseRecommendationRepository } from "#modules/recommendations/infrastructure/SupabaseRecommendationRepository.js";
import { createPersonalizeRecommendation } from "#modules/recommendations/application/PersonalizeRecommendation.js";
import type { IdeaReviewer, IdeaWriter } from "#modules/recommendations/domain/IdeaWriter.js";
import type { IdeaReactionRepository } from "#modules/recommendations/domain/IdeaReaction.js";
import { createListIdeaReactions, createSetIdeaReaction } from "#modules/recommendations/application/IdeaReactions.js";
import { InMemoryIdeaReactionRepository } from "#modules/recommendations/infrastructure/InMemoryIdeaReactionRepository.js";
import { SupabaseIdeaReactionRepository } from "#modules/recommendations/infrastructure/SupabaseIdeaReactionRepository.js";
import type { PersonalizedIdeaRepository } from "#modules/recommendations/domain/PersonalizedIdea.js";
import { FakeIdeaReviewer, FakeIdeaWriter } from "#modules/recommendations/infrastructure/FakeIdeaWriter.js";
import { FakeOptionSuggester } from "#modules/recommendations/infrastructure/FakeOptionSuggester.js";
import { AnthropicIdeaReviewer, AnthropicIdeaWriter, AnthropicOptionSuggester } from "#modules/recommendations/infrastructure/anthropic/AnthropicIdeaProvider.js";
import { createAnthropicModel } from "#modules/recommendations/infrastructure/anthropic/AnthropicStructuredModel.js";
import type { EventRepository } from "#modules/agenda/domain/UserEvent.js";
import { createAddEvent, createDeleteEvent, createListEvents } from "#modules/agenda/application/Events.js";
import { InMemoryEventRepository } from "#modules/agenda/infrastructure/InMemoryEventRepository.js";
import { SupabaseEventRepository } from "#modules/agenda/infrastructure/SupabaseEventRepository.js";
import type { TripRepository } from "#modules/agenda/domain/Trip.js";
import { createAddTrip, createDeleteTrip, createListTrips } from "#modules/agenda/application/Trips.js";
import { InMemoryTripRepository } from "#modules/agenda/infrastructure/InMemoryTripRepository.js";
import { SupabaseTripRepository } from "#modules/agenda/infrastructure/SupabaseTripRepository.js";
import type { MilestoneRepository } from "#modules/agenda/domain/Milestone.js";
import { createAddMilestone, createDeleteMilestone, createListMilestones } from "#modules/agenda/application/Milestones.js";
import { InMemoryMilestoneRepository } from "#modules/agenda/infrastructure/InMemoryMilestoneRepository.js";
import { SupabaseMilestoneRepository } from "#modules/agenda/infrastructure/SupabaseMilestoneRepository.js";
import type { AttemptLimiter } from "#shared/domain/AttemptLimiter.js";
import { InMemoryAttemptLimiter, UnlimitedAttemptLimiter } from "#shared/infrastructure/InMemoryAttemptLimiter.js";
import { SupabaseAttemptLimiter } from "#shared/infrastructure/SupabaseAttemptLimiter.js";
import { InMemoryAiUsageLimiter } from "#modules/recommendations/infrastructure/InMemoryAiUsageLimiter.js";
import { SupabaseAiUsageLimiter } from "#modules/recommendations/infrastructure/SupabaseAiUsageLimiter.js";
import { type AiUsageLimiter, parseAiDailyLimit } from "#modules/recommendations/domain/AiUsageLimiter.js";
import type { OptionSuggester } from "#modules/recommendations/domain/OptionSuggester.js";
import { createSuggestExperienceOptions } from "#modules/recommendations/application/SuggestExperienceOptions.js";
import { createSetAiSuggestions } from "#modules/accounts/application/SetAiSuggestions.js";
import { InMemoryPersonalizedIdeaRepository } from "#modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository.js";
import { InMemoryExperienceRepository } from "#modules/assessments/infrastructure/InMemoryExperienceRepository.js";
import { SupabaseExperienceRepository } from "#modules/assessments/infrastructure/SupabaseExperienceRepository.js";
import { type ExperienceRepository } from "#modules/assessments/domain/Experience.js";
import { createAddExperience, createDeleteExperience, createListExperiences } from "#modules/assessments/application/Experiences.js";
import {
  createListSharedExperiences,
  createReportSharedExperience,
  createShareExperience,
  createUnshareExperience,
} from "#modules/assessments/application/SharedExperiences.js";
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
  return new SupabaseAuthProvider(url, serviceRoleKey, resetPasswordUrl(appUrl));
}

/**
 * SEC-02: el contador de intentos vive en la base de datos (cada función
 * serverless está aislada). Contra un Supabase local no hay tope: es la base
 * de los E2E y de `dev:local`, donde una misma máquina registra decenas de
 * cuentas en segundos, y no hay nada real que proteger.
 */
function createAttemptLimiter(environment: Environment, clock: Clock): AttemptLimiter {
  if (environment === "test") return new InMemoryAttemptLimiter(clock);
  const { url, serviceRoleKey } = supabaseCredentials();
  if (["127.0.0.1", "localhost"].includes(new URL(url).hostname)) return new UnlimitedAttemptLimiter();
  return new SupabaseAttemptLimiter(url, serviceRoleKey, clock);
}

function createExperienceRepository(environment: Environment): ExperienceRepository {
  if (environment === "test") {
    return new InMemoryExperienceRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseExperienceRepository(url, serviceRoleKey);
}

/** RF-19: se escribe desde la ventana de ideas y se lee en Inicio (funciones distintas): base de datos real fuera de los tests. */
function createEventRepository(environment: Environment): EventRepository {
  if (environment === "test") return new InMemoryEventRepository();
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseEventRepository(url, serviceRoleKey);
}

function createTripRepository(environment: Environment): TripRepository {
  if (environment === "test") return new InMemoryTripRepository();
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseTripRepository(url, serviceRoleKey);
}

function createMilestoneRepository(environment: Environment): MilestoneRepository {
  if (environment === "test") return new InMemoryMilestoneRepository();
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseMilestoneRepository(url, serviceRoleKey);
}

function createIdeaReactionRepository(environment: Environment): IdeaReactionRepository {
  if (environment === "test") return new InMemoryIdeaReactionRepository();
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabaseIdeaReactionRepository(url, serviceRoleKey);
}

function createPersonalizedIdeaRepository(environment: Environment): PersonalizedIdeaRepository {
  if (environment === "test") {
    return new InMemoryPersonalizedIdeaRepository();
  }
  const { url, serviceRoleKey } = supabaseCredentials();
  return new SupabasePersonalizedIdeaRepository(url, serviceRoleKey);
}

interface IdeaProvider {
  writer?: IdeaWriter;
  reviewer: IdeaReviewer;
  suggester?: OptionSuggester;
  /** Solo con el proveedor real: el *Fake* no gasta nada, así que no se cuenta. */
  usageLimiter?: AiUsageLimiter;
}

/**
 * RF-40 y RF-45: quién escribe las ideas personalizadas y propone opciones, según
 * `AI_IDEAS_PROVIDER` (el mismo proveedor para las dos: disponibles o no a la vez).
 * - sin valor: funciones apagadas; las opciones ni se ofrecen.
 * - `fake`: proveedor determinista y gratuito (desarrollo local, E2E y tests).
 * - `anthropic` (RF-40b): el modelo real, con `ANTHROPIC_API_KEY` y un tope diario
 *   por usuario (`AI_DAILY_LIMIT`). Sin clave, apagado con un aviso en el log.
 */
function createIdeaProvider(environment: Environment, clock: Clock): IdeaProvider {
  const provider = process.env.AI_IDEAS_PROVIDER?.trim();
  if (provider === "fake") return { writer: new FakeIdeaWriter(), reviewer: new FakeIdeaReviewer(), suggester: new FakeOptionSuggester() };
  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (apiKey) {
      const model = createAnthropicModel(apiKey);
      const limit = parseAiDailyLimit(process.env.AI_DAILY_LIMIT);
      const { url, serviceRoleKey } = environment === "test" ? { url: "", serviceRoleKey: "" } : supabaseCredentials();
      return {
        writer: new AnthropicIdeaWriter(model),
        reviewer: new AnthropicIdeaReviewer(model),
        suggester: new AnthropicOptionSuggester(model),
        usageLimiter: environment === "test" ? new InMemoryAiUsageLimiter(limit, clock) : new SupabaseAiUsageLimiter(url, serviceRoleKey, limit, clock),
      };
    }
    logger.warn("AI_IDEAS_PROVIDER=anthropic sin ANTHROPIC_API_KEY: IA apagada");
  } else if (provider) {
    logger.warn("AI_IDEAS_PROVIDER desconocido: IA apagada", { provider });
  }
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
  /** Borra un usuario con todos sus datos, sin pedir contraseña: solo para herramientas del servidor (TFM-01, restaurar la cuenta de prueba). */
  eraseUser: ReturnType<typeof createEraseUser>;
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
  experienceRepository: ExperienceRepository;
  addExperience: ReturnType<typeof createAddExperience>;
  listExperiences: ReturnType<typeof createListExperiences>;
  deleteExperience: ReturnType<typeof createDeleteExperience>;
  shareExperience: ReturnType<typeof createShareExperience>;
  unshareExperience: ReturnType<typeof createUnshareExperience>;
  listSharedExperiences: ReturnType<typeof createListSharedExperiences>;
  reportSharedExperience: ReturnType<typeof createReportSharedExperience>;
  recommendationRepository: RecommendationRepository;
  listRecommendations: ReturnType<typeof createListRecommendations>;
  /** RF-19: guardar una idea, darla por hecha o descartarla. */
  addEvent: ReturnType<typeof createAddEvent>;
  listEvents: ReturnType<typeof createListEvents>;
  deleteEvent: ReturnType<typeof createDeleteEvent>;
  addTrip: ReturnType<typeof createAddTrip>;
  listTrips: ReturnType<typeof createListTrips>;
  deleteTrip: ReturnType<typeof createDeleteTrip>;
  addMilestone: ReturnType<typeof createAddMilestone>;
  listMilestones: ReturnType<typeof createListMilestones>;
  deleteMilestone: ReturnType<typeof createDeleteMilestone>;
  setIdeaReaction: ReturnType<typeof createSetIdeaReaction>;
  listIdeaReactions: ReturnType<typeof createListIdeaReactions>;
  /** RF-40: si hay un proveedor de IA configurado (la interfaz solo ofrece la opción entonces). */
  aiIdeasAvailable: boolean;
  /** SEC-02: tope de intentos de los controladores públicos (inicio de sesión, registro…). */
  attemptLimiter: AttemptLimiter;
  setAiSuggestions: ReturnType<typeof createSetAiSuggestions>;
  suggestExperienceOptions: ReturnType<typeof createSuggestExperienceOptions>;
  personalizeRecommendation: ReturnType<typeof createPersonalizeRecommendation>;
  setAiIdeas: ReturnType<typeof createSetAiIdeas>;
}

export function createAppContext(environment: Environment = detectEnvironment()): AppContext {
  const authProvider = createAuthProvider(environment);
  const clock = new SystemClock();
  const consentRepository = createConsentRepository(environment);
  const profileRepository = createProfileRepository(environment);
  const categoryRepository = createCategoryRepository(environment);
  const categoryCatalogRepository = createCategoryCatalogRepository(environment);
  const checkConsent = createCheckConsent(consentRepository);
  const assessmentRepository = createAssessmentRepository(environment);
  const recommendationRepository = createRecommendationRepository(environment);
  const personalizedIdeaRepository = createPersonalizedIdeaRepository(environment);
  // RF-46: si cambian la profesión o las aficiones, las ideas ya escritas con IA se rehacen.
  const updateProfile = createUpdateProfile(profileRepository, { onInterestsChanged: (userId) => personalizedIdeaRepository.deleteByUserId(userId) });
  const registerUser = createRegisterUser(authProvider, updateProfile);
  const ideaReactionRepository = createIdeaReactionRepository(environment);
  const eventRepository = createEventRepository(environment);
  const tripRepository = createTripRepository(environment);
  const milestoneRepository = createMilestoneRepository(environment);
  const experienceRepository = createExperienceRepository(environment);
  const ideaProvider = createIdeaProvider(environment, clock);
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
      ideaReactionRepository,
      eventRepository,
      tripRepository,
      milestoneRepository,
      experienceRepository,
      auditRepository: createAdminAuditRepository(environment),
      registerUser,
      updateProfile,
      clock,
    }),
    exportUserData: createExportUserData({ profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository, ideaReactionRepository, eventRepository, tripRepository, milestoneRepository, clock }),
    deleteAccount: createDeleteAccount({ authProvider, profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository, ideaReactionRepository, eventRepository, tripRepository, milestoneRepository, protectedEmail: process.env.DEMO_USER_EMAIL }),
    eraseUser: createEraseUser({ authProvider, profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository, ideaReactionRepository, eventRepository, tripRepository, milestoneRepository }),
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
    // RF-44: el diario de experiencias, separado de las evaluaciones.
    experienceRepository,
    addExperience: createAddExperience({ experienceRepository, categoryRepository, clock }),
    listExperiences: createListExperiences(experienceRepository),
    deleteExperience: createDeleteExperience({ experienceRepository, assessmentRepository }),
    // RF-43: compartir experiencias de forma anónima, leerlas y reportarlas.
    shareExperience: createShareExperience({ experienceRepository, categoryRepository, catalog: categoryCatalogRepository, assessmentRepository, clock }),
    unshareExperience: createUnshareExperience(experienceRepository),
    listSharedExperiences: createListSharedExperiences({ experienceRepository, categoryRepository, catalog: categoryCatalogRepository }),
    reportSharedExperience: createReportSharedExperience({ experienceRepository, clock }),
    recommendationRepository,
    listRecommendations: createListRecommendations({ recommendationRepository, categoryRepository, assessmentRepository }),
    addEvent: createAddEvent({ eventRepository, categoryRepository, clock }),
    listEvents: createListEvents(eventRepository),
    deleteEvent: createDeleteEvent(eventRepository),
    addTrip: createAddTrip({ tripRepository, clock }),
    listTrips: createListTrips(tripRepository),
    deleteTrip: createDeleteTrip(tripRepository),
    addMilestone: createAddMilestone({ milestoneRepository, clock }),
    listMilestones: createListMilestones(milestoneRepository),
    deleteMilestone: createDeleteMilestone(milestoneRepository),
    setIdeaReaction: createSetIdeaReaction({ ideaReactionRepository, categoryRepository, catalog: categoryCatalogRepository, clock }),
    listIdeaReactions: createListIdeaReactions(ideaReactionRepository),
    aiIdeasAvailable: ideaProvider.writer !== undefined,
    attemptLimiter: createAttemptLimiter(environment, clock),
    setAiSuggestions: createSetAiSuggestions({ profileRepository, clock }),
    suggestExperienceOptions: createSuggestExperienceOptions({
      experienceRepository,
      categoryRepository,
      catalog: categoryCatalogRepository,
      profileRepository,
      ideaTexts: new JsonIdeaTexts(),
      suggester: ideaProvider.suggester,
      usageLimiter: ideaProvider.usageLimiter,
      report: (reason, error) => logger.warn("Sin sugerencias de la IA (RF-45)", { reason, ...(error ? { error: String(error) } : {}) }),
    }),
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
      usageLimiter: ideaProvider.usageLimiter,
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
