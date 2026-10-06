import type { Locale } from "#shared/domain/locales.js";
import type { Experience, ExperienceRepository, SharedExperience } from "../domain/Experience.js";

/** Fake para tests — ADR-03 apartado 3.6. En dev/producción: SupabaseExperienceRepository. */
export class InMemoryExperienceRepository implements ExperienceRepository {
  private readonly experiences = new Map<string, Experience>();

  async findByUserId(userId: string): Promise<Experience[]> {
    return [...this.experiences.values()].filter((experience) => experience.userId === userId);
  }

  async save(experience: Experience): Promise<void> {
    this.experiences.set(experience.id, experience);
  }

  async delete(userId: string, experienceId: string): Promise<boolean> {
    const experience = this.experiences.get(experienceId);
    if (!experience || experience.userId !== userId) return false;
    this.experiences.delete(experienceId);
    return true;
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, experience] of this.experiences) if (experience.userId === userId) this.experiences.delete(id);
  }

  async findShared({ categoryKey, locale, excludeUserId, limit }: { categoryKey: string; locale: Locale; excludeUserId: string; limit: number }): Promise<SharedExperience[]> {
    return [...this.experiences.values()]
      .filter((experience) => experience.sharedAt && !experience.reportedAt && experience.sharedCategoryKey === categoryKey && experience.sharedLocale === locale && experience.userId !== excludeUserId)
      .sort((a, b) => b.sharedAt!.getTime() - a.sharedAt!.getTime())
      .slice(0, limit)
      .map(({ id, text }) => ({ id, text }));
  }

  async report(experienceId: string, reporterId: string, at: Date): Promise<boolean> {
    const experience = this.experiences.get(experienceId);
    if (!experience?.sharedAt || experience.reportedAt || experience.userId === reporterId) return false;
    this.experiences.set(experienceId, { ...experience, reportedAt: at });
    return true;
  }
}
