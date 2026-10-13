import { type Result, err, ok } from "#shared/domain/Result.js";
import { ValidationError } from "#shared/domain/DomainError.js";
import { GENDERS, type Gender, type Profile } from "../domain/Profile.js";
import type { ProfileRepository } from "../domain/ProfileRepository.js";
import { isAvatarKey as isPublishedAvatarKey } from "../domain/avatars.js";
import { MAX_HOBBIES, isHobby, isOccupation } from "../domain/profileInterests.js";


const MIN_AGE = 0;
const MAX_AGE = 120;

export interface UpdateProfileInput {
  userId: string;
  name?: string;
  birthDate?: string; // ISO "YYYY-MM-DD"
  gender?: Gender;
  timeZone?: string;
  /** RF-26: la clave de un avatar publicado; `null` lo quita. */
  avatarKey?: string | null;
  /** RF-46: una profesión de la lista; `null` la quita. */
  occupation?: string | null;
  /** RF-46: las aficiones marcadas (sustituyen a las anteriores); vacío las quita. */
  hobbies?: readonly string[];
}

interface Options {
  isAvatarKey?: (key: string) => boolean;
  /** RF-46: la profesión o las aficiones han cambiado (lo escrito con IA a partir de ellas ya no vale). */
  onInterestsChanged?: (userId: string) => Promise<void>;
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
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
export function createUpdateProfile(repository: ProfileRepository, { isAvatarKey = isPublishedAvatarKey, onInterestsChanged }: Options = {}) {
  return async function updateProfile(input: UpdateProfileInput): Promise<Result<Profile, ValidationError>> {
    const userId = input.userId.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));

    const hasAnyField =
      input.name !== undefined || input.birthDate !== undefined || input.gender !== undefined || input.timeZone !== undefined || input.avatarKey !== undefined || input.occupation !== undefined || input.hobbies !== undefined;
    if (!hasAnyField) return err(new ValidationError("At least one field must be provided"));

    let name: string | undefined;
    if (input.name !== undefined) {
      name = input.name.trim();
      if (name.length === 0) return err(new ValidationError("Name cannot be empty"));
    }

    if (input.birthDate !== undefined && !isValidBirthDate(input.birthDate)) {
      return err(new ValidationError(`Birth date must be a valid date, not in the future, for an age between ${MIN_AGE} and ${MAX_AGE}`));
    }

    if (input.gender !== undefined && !(GENDERS as readonly string[]).includes(input.gender)) {
      return err(new ValidationError("Gender is not valid"));
    }

    if (input.timeZone !== undefined && !isValidTimeZone(input.timeZone)) {
      return err(new ValidationError("Time zone is not a valid identifier"));
    }

    // RF-26: solo un avatar del catálogo, ya revisado y publicado.
    if (typeof input.avatarKey === "string" && !isAvatarKey(input.avatarKey)) {
      return err(new ValidationError("Avatar is not in the catalogue"));
    }

    // RF-46: solo opciones de las listas cerradas; nunca texto libre.
    if (typeof input.occupation === "string" && !isOccupation(input.occupation)) {
      return err(new ValidationError("Occupation is not in the list"));
    }
    const newHobbies = input.hobbies === undefined ? undefined : [...new Set(input.hobbies)];
    if (newHobbies && (newHobbies.length > MAX_HOBBIES || !newHobbies.every(isHobby))) {
      return err(new ValidationError(`Hobbies must be in the list, ${MAX_HOBBIES} at most`));
    }

    const existing = await repository.findByUserId(userId);
    if (!existing && name === undefined) {
      return err(new ValidationError("A name is required to create a profile"));
    }

    // Se parte del perfil existente: lo que este caso de uso no toca (p. ej. la elección de RF-40) se conserva.
    const { avatarKey: currentAvatarKey, occupation: currentOccupation, hobbies: currentHobbies, ...kept } = existing ?? {};
    const avatarKey = input.avatarKey === undefined ? currentAvatarKey : (input.avatarKey ?? undefined);
    const occupation = input.occupation === undefined ? currentOccupation : (input.occupation ?? undefined);
    const hobbies = newHobbies ?? currentHobbies ?? [];
    const profile: Profile = {
      ...kept,
      userId,
      name: name ?? existing!.name,
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : existing?.birthDate !== undefined ? { birthDate: existing.birthDate } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : existing?.gender !== undefined ? { gender: existing.gender } : {}),
      ...(input.timeZone !== undefined ? { timeZone: input.timeZone } : existing?.timeZone !== undefined ? { timeZone: existing.timeZone } : {}),
      ...(avatarKey !== undefined ? { avatarKey } : {}),
      ...(occupation !== undefined ? { occupation } : {}),
      ...(hobbies.length > 0 ? { hobbies } : {}),
    };
    await repository.save(profile);
    if (existing && (occupation !== currentOccupation || !sameList(hobbies, currentHobbies ?? []))) await onInterestsChanged?.(userId);
    return ok(profile);
  };
}
