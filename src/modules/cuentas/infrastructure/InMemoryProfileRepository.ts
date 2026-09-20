import type { Profile } from "../domain/Profile";
import type { ProfileRepository } from "../domain/ProfileRepository";

/**
 * Fake solo para tests — ADR-03 §3.6. En dev/producción se usa
 * SupabaseProfileRepository (04_Almacenamiento_Datos.md §7bis).
 */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly profiles = new Map<string, Profile>();

  async save(profile: Profile): Promise<void> {
    this.profiles.set(profile.userId, profile);
  }

  async findByUserId(userId: string): Promise<Profile | undefined> {
    return this.profiles.get(userId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.profiles.delete(userId);
  }
}
