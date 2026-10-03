import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { NotFoundError } from "../../../shared/domain/DomainError.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import type { PersonalizedIdeaRepository } from "../../recommendations/domain/PersonalizedIdea.js";
import type { Profile } from "../domain/Profile.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

export interface SetAiIdeasInput {
  userId: string;
  enabled: boolean;
}

interface Dependencies {
  profileRepository: ProfileRepository;
  personalizedIdeaRepository: PersonalizedIdeaRepository;
  clock: Clock;
}

/**
 * Caso de uso — RF-40: el usuario activa o desactiva las ideas personalizadas
 * con IA. Al activarlas se guarda cuándo (constancia del consentimiento); al
 * desactivarlas se borran las ideas ya personalizadas: no quedan restos.
 */
export function createSetAiIdeas({ profileRepository, personalizedIdeaRepository, clock }: Dependencies) {
  return async function setAiIdeas(input: SetAiIdeasInput): Promise<Result<Profile, NotFoundError>> {
    const existing = await profileRepository.findByUserId(input.userId);
    if (!existing) return err(new NotFoundError("Profile not found"));

    const profile: Profile = input.enabled
      ? { ...existing, aiIdeasEnabled: true, aiIdeasEnabledAt: clock.now().toISOString() }
      : { ...existing, aiIdeasEnabled: false, aiIdeasEnabledAt: undefined };
    await profileRepository.save(profile);
    if (!input.enabled) await personalizedIdeaRepository.deleteByUserId(input.userId);
    return ok(profile);
  };
}
