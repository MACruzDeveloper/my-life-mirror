import type { AssessmentRepository } from "../../assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository.js";
import type { PersonalizedIdeaRepository } from "../../recommendations/domain/PersonalizedIdea.js";
import type { RecommendationRepository } from "../../recommendations/domain/RecommendationRepository.js";
import type { ConsentRepository } from "../../consent/domain/ConsentRepository.js";
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
}

/**
 * Borrado en profundidad de un usuario — lo comparten `DeleteAccount` (RF-05,
 * lo pide el propio usuario) y `AdminUserActions.deleteUser` (ADM-03). No
 * comprueba permisos ni contraseñas: eso es responsabilidad de quien lo llama.
 * Orden: datos primero, cuenta de acceso la última — si algo falla por el
 * camino se puede repetir (todos los pasos son repetibles) y nunca quedan
 * datos huérfanos sin una cuenta que pueda pedir su borrado.
 */
export function createEraseUser({ authProvider, profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, personalizedIdeaRepository }: EraseUserDependencies) {
  return async function eraseUser(userId: string): Promise<void> {
    await personalizedIdeaRepository.deleteByUserId(userId);
    await recommendationRepository.deleteByUserId(userId);
    await assessmentRepository.deleteByUserId(userId);
    await categoryRepository.deleteByUserId(userId);
    await consentRepository.deleteByUser(userId);
    await profileRepository.deleteByUserId(userId);
    await authProvider.deleteUser(userId);
  };
}
