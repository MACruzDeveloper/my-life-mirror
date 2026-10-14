import { type Result, ok } from "#shared/domain/Result.js";
import type { Clock } from "#shared/domain/Clock.js";
import type { AssessmentRepository } from "#modules/assessments/domain/AssessmentRepository.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import type { EventRepository } from "#modules/agenda/domain/UserEvent.js";
import type { TripRepository } from "#modules/agenda/domain/Trip.js";
import type { IdeaReactionRepository } from "#modules/recommendations/domain/IdeaReaction.js";
import type { PersonalizedIdeaRepository } from "#modules/recommendations/domain/PersonalizedIdea.js";
import type { ExperienceRepository } from "#modules/assessments/domain/Experience.js";
import type { RecommendationRepository } from "#modules/recommendations/domain/RecommendationRepository.js";
import type { ConsentRepository } from "#modules/consent/domain/ConsentRepository.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export interface UserDataExport {
  schemaVersion: 1;
  exportedAt: string;
  account: { id: string; email: string };
  profile: { name: string; birthDate?: string; gender?: string; timeZone?: string; occupation?: string; hobbies?: string[] } | null;
  categories: { name: string; description: string; type: string; status: string; isSensitiveData: boolean; experienceTags: string[]; difficultyTags: string[] }[];
  consents: { category: string; policyVersion: string; grantedAt: string }[];
  assessments: { category: string; score: number; note?: string; recordedAt: string }[];
  recommendations: { category: string; templateKey: string; status: string; createdAt: string }[];
  /** RF-40: si activó las ideas con IA y cuándo, y las ideas que se le personalizaron. */
  aiIdeas: { enabled: boolean; enabledAt?: string };
  /** RF-45: si tiene activadas las sugerencias a partir de sus experiencias, y desde cuándo. */
  aiSuggestions: { enabled: boolean; enabledAt?: string };
  personalizedIdeas: { category: string; locale: string; templateKey: string; text: string; model: string; createdAt: string }[];
  /** RF-19: lo que decidió sobre cada idea: guardada, hecha o descartada. */
  ideaReactions: { category: string; templateKey: string; reaction: string; reactedAt: string; plannedFor?: string }[];
  /** RF-48: sus eventos del calendario. */
  events: { title: string; day: string; categories: string[] }[];
  /** RF-49: sus viajes. */
  trips: { country: string; year: number; month?: number }[];
  /** RF-44: el diario de experiencias, de la más antigua a la más reciente. */
  experiences: { category: string; text: string; createdAt: string; sharedAt?: string; reportedAt?: string }[];
}

interface Dependencies {
  profileRepository: ProfileRepository;
  categoryRepository: CategoryRepository;
  consentRepository: ConsentRepository;
  assessmentRepository: AssessmentRepository;
  recommendationRepository: RecommendationRepository;
  personalizedIdeaRepository: PersonalizedIdeaRepository;
  experienceRepository: ExperienceRepository;
  ideaReactionRepository: IdeaReactionRepository;
  eventRepository: EventRepository;
  tripRepository: TripRepository;
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
export function createExportUserData({ profileRepository, categoryRepository, consentRepository, assessmentRepository, recommendationRepository, ideaReactionRepository, eventRepository, tripRepository, personalizedIdeaRepository, experienceRepository, clock }: Dependencies) {
  return async function exportUserData(user: { id: string; email: string }): Promise<Result<UserDataExport, never>> {
    const [profile, categories, consents, assessments, recommendations, personalizedIdeas, experiences, ideaReactions, events, trips] = await Promise.all([
      profileRepository.findByUserId(user.id),
      categoryRepository.findByUserId(user.id),
      consentRepository.findByUser(user.id),
      assessmentRepository.findByUserId(user.id),
      recommendationRepository.findByUserId(user.id),
      personalizedIdeaRepository.findByUserId(user.id),
      experienceRepository.findByUserId(user.id),
      ideaReactionRepository.findByUserId(user.id),
      eventRepository.findByUserId(user.id),
      tripRepository.findByUserId(user.id),
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
            // RF-46: las claves de las listas cerradas.
            ...(profile.occupation ? { occupation: profile.occupation } : {}),
            ...(profile.hobbies && profile.hobbies.length > 0 ? { hobbies: [...profile.hobbies] } : {}),
          }
        : null,
      categories: categories.map((c) => ({ name: c.name, description: c.description, type: c.type, status: c.status, isSensitiveData: c.isSensitiveData, experienceTags: [...(c.experienceTags ?? [])], difficultyTags: [...(c.difficultyTags ?? [])] })),
      consents: consents.map((c) => ({ category: names.get(c.categoryId) ?? "", policyVersion: c.policyVersion, grantedAt: c.grantedAt.toISOString() })),
      recommendations: recommendations.map((r) => ({ category: names.get(r.categoryId) ?? "", templateKey: r.templateKey, status: r.status, createdAt: r.createdAt.toISOString() })),
      aiIdeas: { enabled: profile?.aiIdeasEnabled === true, ...(profile?.aiIdeasEnabledAt ? { enabledAt: profile.aiIdeasEnabledAt } : {}) },
      aiSuggestions: { enabled: profile?.aiSuggestionsEnabled === true, ...(profile?.aiSuggestionsEnabledAt ? { enabledAt: profile.aiSuggestionsEnabledAt } : {}) },
      personalizedIdeas: personalizedIdeas.map((idea) => {
        const categoryId = recommendations.find((r) => r.id === idea.recommendationId)?.categoryId;
        return { category: (categoryId && names.get(categoryId)) || "", locale: idea.locale, templateKey: idea.templateKey, text: idea.text, model: idea.model, createdAt: idea.createdAt.toISOString() };
      }),
      ideaReactions: [...ideaReactions]
        .sort((a, b) => a.reactedAt.getTime() - b.reactedAt.getTime())
        .map((reaction) => ({ category: names.get(reaction.categoryId) ?? "", templateKey: reaction.templateKey, reaction: reaction.reaction, reactedAt: reaction.reactedAt.toISOString(), ...(reaction.plannedFor ? { plannedFor: reaction.plannedFor } : {}) })),
      events: [...events]
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((event) => ({ title: event.title, day: event.day, categories: event.categoryIds.flatMap((categoryId) => names.get(categoryId) ?? []) })),
      trips: [...trips].sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0)).map(({ countryCode, year, month }) => ({ country: countryCode, year, ...(month !== undefined ? { month } : {}) })),
      experiences: [...experiences]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((experience) => ({
          category: names.get(experience.categoryId) ?? "",
          text: experience.text,
          createdAt: experience.createdAt.toISOString(),
          // RF-43: compartida de forma anónima, y si se retiró tras un reporte.
          ...(experience.sharedAt && { sharedAt: experience.sharedAt.toISOString() }),
          ...(experience.reportedAt && { reportedAt: experience.reportedAt.toISOString() }),
        })),
      assessments: [...assessments]
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
        .map((a) => ({ category: names.get(a.categoryId) ?? "", score: a.score, ...(a.note ? { note: a.note } : {}), recordedAt: a.recordedAt.toISOString() })),
    });
  };
}
