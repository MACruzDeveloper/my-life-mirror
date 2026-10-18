import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import type { Clock } from "#shared/domain/Clock.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import { byNewestTrip } from "../domain/Trip.js";
import { MAX_MILESTONE_TITLE_LENGTH, MAX_MILESTONES_PER_USER, type Milestone, type MilestoneRepository, isMilestoneCategory, isValidMilestoneDate } from "../domain/Milestone.js";

export interface AddMilestoneInput {
  userId: string;
  categoryKey: string;
  title: string;
  year: number;
  month?: number;
}

/** Lo que ve la interfaz: sin el usuario, que ya se sabe. */
export type MilestoneView = Pick<Milestone, "id" | "categoryKey" | "title" | "year" | "month">;

function toView({ id, categoryKey, title, year, month }: Milestone): MilestoneView {
  return { id, categoryKey, title, year, ...(month !== undefined ? { month } : {}) };
}

/** Caso de uso — RF-49: guardar un hito. Es un recuerdo: no toca ninguna puntuación. */
export function createAddMilestone({ milestoneRepository, clock }: { milestoneRepository: MilestoneRepository; clock: Clock }) {
  return async function addMilestone(input: AddMilestoneInput): Promise<Result<MilestoneView, ValidationError>> {
    const userId = input.userId.trim();
    const title = input.title.trim();
    if (!isMilestoneCategory(input.categoryKey)) return err(new ValidationError("Category has no milestones"));
    if (title.length === 0 || title.length > MAX_MILESTONE_TITLE_LENGTH) return err(new ValidationError(`Title must be 1-${MAX_MILESTONE_TITLE_LENGTH} characters`));
    const now = clock.now();
    if (!isValidMilestoneDate(input.year, input.month, now)) return err(new ValidationError("Year must be between 1900 and the current year, and month between 1 and 12"));
    if ((await milestoneRepository.findByUserId(userId)).length >= MAX_MILESTONES_PER_USER) return err(new ValidationError("Too many milestones"));

    const milestone: Milestone = { id: randomUUID(), userId, categoryKey: input.categoryKey, title, year: input.year, ...(input.month !== undefined ? { month: input.month } : {}), createdAt: now };
    await milestoneRepository.save(milestone);
    return ok(toView(milestone));
  };
}

/** Caso de uso — RF-49: los hitos de una categoría, del más reciente al más antiguo (sin mes, al final de su año). */
export function createListMilestones(milestoneRepository: MilestoneRepository) {
  return async function listMilestones(input: { userId: string; categoryKey: string }): Promise<Result<MilestoneView[], ValidationError>> {
    if (!isMilestoneCategory(input.categoryKey)) return err(new ValidationError("Category has no milestones"));
    const milestones = (await milestoneRepository.findByUserId(input.userId.trim())).filter((milestone) => milestone.categoryKey === input.categoryKey);
    return ok(milestones.sort((a, b) => byNewestTrip(a, b) || b.createdAt.getTime() - a.createdAt.getTime()).map(toView));
  };
}

/** Caso de uso — RF-49: borrar un hito propio. */
export function createDeleteMilestone(milestoneRepository: MilestoneRepository) {
  return async function deleteMilestone(input: { userId: string; milestoneId: string }): Promise<Result<void, NotFoundError>> {
    const deleted = await milestoneRepository.delete(input.userId.trim(), input.milestoneId.trim());
    return deleted ? ok(undefined) : err(new NotFoundError("Milestone not found"));
  };
}
