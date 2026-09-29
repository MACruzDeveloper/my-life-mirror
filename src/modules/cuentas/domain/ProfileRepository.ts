import type { Profile } from "./Profile.js";

/** Puerto — ADR-03 apartado 3.3. `save` es upsert: un usuario tiene un único perfil. */
export interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  findByUserId(userId: string): Promise<Profile | undefined>;
  /** Borra el perfil del usuario (RF-05). Repetible. */
  deleteByUserId(userId: string): Promise<void>;
}
