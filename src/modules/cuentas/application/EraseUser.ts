import type { AssessmentRepository } from "../../assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository.js";
import type { RecommendationRepository } from "../../recommendations/domain/RecommendationRepository.js";
import type { ConsentimientoRepository } from "../../consentimiento/domain/ConsentimientoRepository.js";
import type { AuthProvider } from "../domain/AuthProvider.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export interface EraseUserDependencies {
  authProvider: AuthProvider;
  profileRepository: ProfileRepository;
  categoryRepository: CategoryRepository;
  consentimientoRepository: ConsentimientoRepository;
  assessmentRepository: AssessmentRepository;
  recommendationRepository: RecommendationRepository;
}

/**
 * Borrado en profundidad de un usuario — lo comparten `DeleteAccount` (RF-05,
 * lo pide el propio usuario) y `AdminUserActions.deleteUser` (ADM-03). No
 * comprueba permisos ni contraseñas: eso es responsabilidad de quien lo llama.
 * Orden: datos primero, cuenta de acceso la última — si algo falla por el
 * camino se puede repetir (todos los pasos son repetibles) y nunca quedan
 * datos huérfanos sin una cuenta que pueda pedir su borrado.
 */
export function createEraseUser({ authProvider, profileRepository, categoryRepository, consentimientoRepository, assessmentRepository, recommendationRepository }: EraseUserDependencies) {
  return async function eraseUser(userId: string): Promise<void> {
    await recommendationRepository.deleteByUserId(userId);
    await assessmentRepository.deleteByUserId(userId);
    await categoryRepository.deleteByUserId(userId);
    await consentimientoRepository.eliminarPorUsuario(userId);
    await profileRepository.deleteByUserId(userId);
    await authProvider.eliminarUsuario(userId);
  };
}
