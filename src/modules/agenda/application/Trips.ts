import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "#shared/domain/Result.js";
import type { Clock } from "#shared/domain/Clock.js";
import { NotFoundError, ValidationError } from "#shared/domain/DomainError.js";
import { MAX_TRIPS_PER_USER, type Trip, type TripRepository, byNewestTrip, isValidTripCountry, isValidTripDate } from "../domain/Trip.js";

export interface AddTripInput {
  userId: string;
  countryCode: string;
  year: number;
  month?: number;
}

/** Lo que ve la interfaz: sin el usuario, que ya se sabe. */
export type TripView = Pick<Trip, "id" | "countryCode" | "year" | "month">;

function toView({ id, countryCode, year, month }: Trip): TripView {
  return { id, countryCode, year, ...(month !== undefined ? { month } : {}) };
}

/** Caso de uso — RF-49: guardar un viaje. Es un recuerdo: no toca ninguna puntuación. */
export function createAddTrip({ tripRepository, clock }: { tripRepository: TripRepository; clock: Clock }) {
  return async function addTrip(input: AddTripInput): Promise<Result<TripView, ValidationError>> {
    const userId = input.userId.trim();
    if (!isValidTripCountry(input.countryCode)) return err(new ValidationError("Country is not in the list"));
    const now = clock.now();
    if (!isValidTripDate(input.year, input.month, now)) return err(new ValidationError("Year must be between 1900 and two years from now, and month between 1 and 12"));
    if ((await tripRepository.findByUserId(userId)).length >= MAX_TRIPS_PER_USER) return err(new ValidationError("Too many trips"));

    const trip: Trip = { id: randomUUID(), userId, countryCode: input.countryCode, year: input.year, ...(input.month !== undefined ? { month: input.month } : {}), createdAt: now };
    await tripRepository.save(trip);
    return ok(toView(trip));
  };
}

/** Caso de uso — RF-49: los viajes de la persona, del más reciente al más antiguo. */
export function createListTrips(tripRepository: TripRepository) {
  return async function listTrips(userId: string): Promise<Result<TripView[], never>> {
    const trips = await tripRepository.findByUserId(userId.trim());
    return ok([...trips].sort((a, b) => byNewestTrip(a, b) || b.createdAt.getTime() - a.createdAt.getTime()).map(toView));
  };
}

/** Caso de uso — RF-49: borrar un viaje propio. */
export function createDeleteTrip(tripRepository: TripRepository) {
  return async function deleteTrip(input: { userId: string; tripId: string }): Promise<Result<void, NotFoundError>> {
    const deleted = await tripRepository.delete(input.userId.trim(), input.tripId.trim());
    return deleted ? ok(undefined) : err(new NotFoundError("Trip not found"));
  };
}
