import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import type { Profile } from "../domain/Profile.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";

/** Caso de uso de solo lectura — RF-03. `undefined` significa "todavía sin perfil", no un error. */
export function createGetProfile(repository: ProfileRepository) {
  return async function getProfile(userId: string): Promise<Result<Profile | undefined, ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));

    const profile = await repository.findByUserId(id);
    return ok(profile);
  };
}
