import { type Result, err, ok } from "#shared/domain/Result.js";
import { NotFoundError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import type { Profile } from "../domain/Profile.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

interface Dependencies {
  profileRepository: ProfileRepository;
  clock: Clock;
}

/**
 * Caso de uso — RF-45: el usuario activa o desactiva las sugerencias de la IA a
 * partir de sus experiencias. Al activarlas se guarda cuándo (constancia del
 * consentimiento). No hay nada que borrar al desactivarlas: de la IA solo quedan
 * las opciones que el usuario aceptó, que son suyas como si las hubiera tocado.
 */
export function createSetAiSuggestions({ profileRepository, clock }: Dependencies) {
  return async function setAiSuggestions(input: { userId: string; enabled: boolean }): Promise<Result<Profile, NotFoundError>> {
    const existing = await profileRepository.findByUserId(input.userId);
    if (!existing) return err(new NotFoundError("Profile not found"));

    const profile: Profile = input.enabled
      ? { ...existing, aiSuggestionsEnabled: true, aiSuggestionsEnabledAt: clock.now().toISOString() }
      : { ...existing, aiSuggestionsEnabled: false, aiSuggestionsEnabledAt: undefined };
    await profileRepository.save(profile);
    return ok(profile);
  };
}
