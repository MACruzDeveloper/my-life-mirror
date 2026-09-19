import { type Result, err, ok } from "../../../shared/domain/Result";
import { ValidationError } from "../../../shared/domain/DomainError";
import type { Gender, Profile } from "../domain/Profile";
import type { ProfileRepository } from "../domain/ProfileRepository";

const VALID_GENDERS: readonly Gender[] = ["woman", "man", "non-binary", "prefer-not-to-say"];
const MIN_AGE = 0;
const MAX_AGE = 120;

export interface UpdateProfileInput {
  userId: string;
  name?: string;
  birthDate?: string; // ISO "YYYY-MM-DD"
  gender?: Gender;
  timeZone?: string;
}

function isValidTimeZone(value: string): boolean {
  return Intl.supportedValuesOf("timeZone").includes(value);
}

function calculateAge(birthDate: Date, now: Date): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

function isValidBirthDate(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (date > now) return false;
  const age = calculateAge(date, now);
  return age >= MIN_AGE && age <= MAX_AGE;
}

/**
 * Caso de uso — RF-03/RF-01. Upsert parcial: cada campo se valida solo si
 * se indica, y el resultado se fusiona sobre el perfil ya existente (si lo
 * hay) — así el registro (RF-01) puede crear el perfil con solo `name`, y la
 * pantalla de perfil rellena el resto más tarde sin pisar lo que ya había.
 * Sin política de edad mínima — solo sanidad de datos (ver
 * docs/user-stories/RF-03-configurar-perfil.md).
 */
export function createUpdateProfile(repository: ProfileRepository) {
  return async function updateProfile(input: UpdateProfileInput): Promise<Result<Profile, ValidationError>> {
    const userId = input.userId.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));

    const hasAnyField =
      input.name !== undefined || input.birthDate !== undefined || input.gender !== undefined || input.timeZone !== undefined;
    if (!hasAnyField) return err(new ValidationError("At least one field must be provided"));

    let name: string | undefined;
    if (input.name !== undefined) {
      name = input.name.trim();
      if (name.length === 0) return err(new ValidationError("Name cannot be empty"));
    }

    if (input.birthDate !== undefined && !isValidBirthDate(input.birthDate)) {
      return err(new ValidationError(`Birth date must be a valid date, not in the future, for an age between ${MIN_AGE} and ${MAX_AGE}`));
    }

    if (input.gender !== undefined && !VALID_GENDERS.includes(input.gender)) {
      return err(new ValidationError("Gender is not valid"));
    }

    if (input.timeZone !== undefined && !isValidTimeZone(input.timeZone)) {
      return err(new ValidationError("Time zone is not a valid identifier"));
    }

    const existing = await repository.findByUserId(userId);
    if (!existing && name === undefined) {
      return err(new ValidationError("A name is required to create a profile"));
    }

    const profile: Profile = {
      userId,
      name: name ?? existing!.name,
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : existing?.birthDate !== undefined ? { birthDate: existing.birthDate } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : existing?.gender !== undefined ? { gender: existing.gender } : {}),
      ...(input.timeZone !== undefined ? { timeZone: input.timeZone } : existing?.timeZone !== undefined ? { timeZone: existing.timeZone } : {}),
    };
    await repository.save(profile);
    return ok(profile);
  };
}
