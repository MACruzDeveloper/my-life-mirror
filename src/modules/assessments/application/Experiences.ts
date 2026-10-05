import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import type { Clock } from "#shared/domain/Clock.js";
import type { CategoryRepository } from "#modules/categories/domain/CategoryRepository.js";
import { type Experience, type ExperienceRepository, MAX_EXPERIENCE_LENGTH } from "../domain/Experience.js";

interface AddDependencies {
  experienceRepository: ExperienceRepository;
  categoryRepository: CategoryRepository;
  clock: Clock;
}

/**
 * Casos de uso — RF-44, el diario de experiencias. Añadir no necesita puntuar:
 * la experiencia tiene su propio guardado. El usuario sale siempre de la sesión.
 */
export function createAddExperience({ experienceRepository, categoryRepository, clock }: AddDependencies) {
  return async function addExperience(input: { userId: string; categoryId: string; text: string }): Promise<Result<Experience, ValidationError | NotFoundError>> {
    const userId = input.userId.trim();
    const text = input.text.trim();
    if (userId.length === 0) return err(new ValidationError("User is required"));
    if (text.length === 0) return err(new ValidationError("Experience cannot be empty"));
    if (text.length > MAX_EXPERIENCE_LENGTH) return err(new ValidationError(`Experience cannot exceed ${MAX_EXPERIENCE_LENGTH} characters`));

    const category = await categoryRepository.findById(userId, input.categoryId.trim());
    if (!category) return err(new NotFoundError("Category not found"));

    const experience: Experience = { id: randomUUID(), userId, categoryId: category.id, text, createdAt: clock.now() };
    await experienceRepository.save(experience);
    return ok(experience);
  };
}

/** Las del usuario, la más reciente primero. */
export function createListExperiences(experienceRepository: ExperienceRepository) {
  return async function listExperiences(userId: string): Promise<Result<Experience[], ValidationError>> {
    const id = userId.trim();
    if (id.length === 0) return err(new ValidationError("User is required"));
    const experiences = await experienceRepository.findByUserId(id);
    return ok([...experiences].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };
}

export function createDeleteExperience(experienceRepository: ExperienceRepository) {
  return async function deleteExperience(input: { userId: string; experienceId: string }): Promise<Result<true, NotFoundError>> {
    const deleted = await experienceRepository.delete(input.userId.trim(), input.experienceId.trim());
    return deleted ? ok(true) : err(new NotFoundError("Experience not found"));
  };
}
