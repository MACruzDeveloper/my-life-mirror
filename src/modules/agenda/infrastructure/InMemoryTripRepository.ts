import type { Trip, TripRepository } from "../domain/Trip.js";

/** Fake para tests — ADR-03 apartado 3.6. En desarrollo y producción, `SupabaseTripRepository`. */
export class InMemoryTripRepository implements TripRepository {
  private readonly trips = new Map<string, Trip>();

  async findByUserId(userId: string): Promise<Trip[]> {
    return [...this.trips.values()].filter((trip) => trip.userId === userId);
  }

  async save(trip: Trip): Promise<void> {
    this.trips.set(trip.id, trip);
  }

  async delete(userId: string, tripId: string): Promise<boolean> {
    if (this.trips.get(tripId)?.userId !== userId) return false;
    return this.trips.delete(tripId);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, trip] of this.trips) {
      if (trip.userId === userId) this.trips.delete(id);
    }
  }
}
