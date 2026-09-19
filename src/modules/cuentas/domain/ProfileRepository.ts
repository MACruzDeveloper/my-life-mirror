import type { Profile } from "./Profile";

/** Puerto — ADR-03 §3.3. `save` es upsert: un usuario tiene un único perfil. */
export interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  findByUserId(userId: string): Promise<Profile | undefined>;
}
