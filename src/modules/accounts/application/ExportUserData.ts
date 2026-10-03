import { type Result, ok } from "../../../shared/domain/Result.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import type { AssessmentRepository } from "../../assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "../../categories/domain/CategoryRepository.js";
import type { RecommendationRepository } from "../../recommendations/domain/RecommendationRepository.js";
import type { ConsentRepository } from "../../consent/domain/ConsentRepository.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export interface UserDataExport {
  schemaVersion: 1;
  exportedAt: string;
  account: { id: string; email: string };
  profile: { name: string; birthDate?: string; gender?: string; timeZone?: string } | null;
  categories: { name: string; description: string; type: string; status: string; isSensitiveData: boolean; experienceTags: string[] }[];
  consents: { category: string; policyVersion: string; grantedAt: string }[];
  assessments: { category: string; score: number; note?: string; recordedAt: string }[];
  recommendations: { category: string; templateKey: string; status: string; createdAt: string }[];
}

interface Dependencies {
  profileRepository: ProfileRepository;
  categoryRepository: CategoryRepository;
  consentRepository: ConsentRepository;
  assessmentRepository: AssessmentRepository;
  recommendationRepository: RecommendationRepository;
  clock: Clock;
}

/**
 * Caso de uso — RF-05 / RNF-12 (portabilidad). Reúne todo lo del usuario en un
 * documento estructurado y legible: las categorías y evaluaciones salen con su
 * nombre (un identificador interno no le dice nada al usuario) y no se incluye
 * ningún dato de otros usuarios. Orquesta los puertos de otros módulos, igual
 * que `ActivateCategory` con el consentimiento.
 * Ver docs/user-stories/RF-05-exportar-eliminar-datos.md.
 */
export function createExportUserData({ profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, clock }: Dependencies) {
  return async function exportUserData(user: { id: string; email: string }): Promise<Result<UserDataExport, never>> {
    const [profile, categories, consents, assessments, recommendations] = await Promise.all([
      profileRepository.findByUserId(user.id),
      categoryRepository.findByUserId(user.id),
      consentRepository.findByUser(user.id),
      assessmentRepository.findByUserId(user.id),
      recommendationRepository.findByUserId(user.id),
    ]);
    const names = new Map(categories.map((c) => [c.id, c.name]));

    return ok({
      schemaVersion: 1,
      exportedAt: clock.now().toISOString(),
      account: { id: user.id, email: user.email },
      profile: profile
        ? {
            name: profile.name,
            ...(profile.birthDate ? { birthDate: profile.birthDate } : {}),
            ...(profile.gender ? { gender: profile.gender } : {}),
            ...(profile.timeZone ? { timeZone: profile.timeZone } : {}),
          }
        : null,
      categories: categories.map((c) => ({ name: c.name, description: c.description, type: c.type, status: c.status, isSensitiveData: c.isSensitiveData, experienceTags: [...(c.experienceTags ?? [])] })),
      consents: consents.map((c) => ({ category: names.get(c.categoryId) ?? "", policyVersion: c.policyVersion, grantedAt: c.grantedAt.toISOString() })),
      recommendations: recommendations.map((r) => ({ category: names.get(r.categoryId) ?? "", templateKey: r.templateKey, status: r.status, createdAt: r.createdAt.toISOString() })),
      assessments: [...assessments]
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
        .map((a) => ({ category: names.get(a.categoryId) ?? "", score: a.score, ...(a.note ? { note: a.note } : {}), recordedAt: a.recordedAt.toISOString() })),
    });
  };
}
