import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import type { PersonalizedIdeaRepository } from "#modules/recommendations/domain/PersonalizedIdea.js";
import type { EventRepository } from "#modules/agenda/domain/UserEvent.js";
import type { TripRepository } from "#modules/agenda/domain/Trip.js";
import type { MilestoneRepository } from "#modules/agenda/domain/Milestone.js";
import type { IdeaReactionRepository } from "#modules/recommendations/domain/IdeaReaction.js";
import type { ExperienceRepository } from "#modules/assessments/domain/Experience.js";
import type { RecommendationRepository } from "#modules/recommendations/domain/RecommendationRepository.js";
import type { ConsentRepository } from "#modules/consent/domain/ConsentRepository.js";
import type { AuthProvider } from "../domain/AuthProvider.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export interface EraseUserDependencies {
  authProvider: AuthProvider;
  profileRepository: ProfileRepository;
  categoryRepository: CategoryRepository;
  consentRepository: ConsentRepository;
  assessmentRepository: AssessmentRepository;
  recommendationRepository: RecommendationRepository;
  /** RF-40: las ideas personalizadas (en la base también caen en cascada; aquí se borran explícitamente, como el resto). */
  personalizedIdeaRepository: PersonalizedIdeaRepository;
  experienceRepository: ExperienceRepository;
  /** RF-19: lo que decidió sobre cada idea (guardada, hecha, descartada). */
  ideaReactionRepository: IdeaReactionRepository;
  /** RF-48: sus eventos del calendario. */
  eventRepository: EventRepository;
  /** RF-49: sus viajes. */
  tripRepository: TripRepository;
  /** RF-49: sus hitos. */
  milestoneRepository: MilestoneRepository;
}

/**
 * Borrado en profundidad de un usuario — lo comparten `DeleteAccount` (RF-05,
 * lo pide el propio usuario) y `AdminUserActions.deleteUser` (ADM-03). No
 * comprueba permisos ni contraseñas: eso es responsabilidad de quien lo llama.
 * Orden: datos primero, cuenta de acceso la última — si algo falla por el
 * camino se puede repetir (todos los pasos son repetibles) y nunca quedan
 * datos huérfanos sin una cuenta que pueda pedir su borrado.
 */
export function createEraseUser({ authProvider, profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository, experienceRepository, ideaReactionRepository, eventRepository, tripRepository, milestoneRepository }: EraseUserDependencies) {
  return async function eraseUser(userId: string): Promise<void> {
    await personalizedIdeaRepository.deleteByUserId(userId);
    await ideaReactionRepository.deleteByUserId(userId);
    await eventRepository.deleteByUserId(userId);
    await tripRepository.deleteByUserId(userId);
    await milestoneRepository.deleteByUserId(userId);
    await experienceRepository.deleteByUserId(userId);
    await recommendationRepository.deleteByUserId(userId);
    await assessmentRepository.deleteByUserId(userId);
    await categoryRepository.deleteByUserId(userId);
    await consentRepository.deleteByUser(userId);
    await profileRepository.deleteByUserId(userId);
    await authProvider.deleteUser(userId);
  };
}
