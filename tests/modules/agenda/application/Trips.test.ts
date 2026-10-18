import { describe, expect, it } from "vitest";
import { createAddTrip, createDeleteTrip, createListTrips } from "@modules/agenda/application/Trips";
import { MAX_TRIPS_PER_USER } from "@modules/agenda/domain/Trip";
import { InMemoryTripRepository } from "@modules/agenda/infrastructure/InMemoryTripRepository";

function setup() {
  const tripRepository = new InMemoryTripRepository();
  const clock = { now: () => new Date("2026-10-14T10:00:00Z") };
  return {
    addTrip: createAddTrip({ tripRepository, clock }),
    listTrips: createListTrips(tripRepository),
    deleteTrip: createDeleteTrip(tripRepository),
  };
}

describe("viajes en la página de Aventura (RF-49)", () => {
  it("guarda un viaje con su país y su año; el mes es opcional", async () => {
    const { addTrip, listTrips } = setup();

    expect((await addTrip({ userId: "ana", countryCode: "MM", year: 2015 })).ok).toBe(true);
    expect((await addTrip({ userId: "ana", countryCode: "PT", year: 2015, month: 6 })).ok).toBe(true);

    const listed = await listTrips("ana");
    expect(listed.ok && listed.value).toEqual([
      { id: expect.any(String), countryCode: "PT", year: 2015, month: 6 },
      { id: expect.any(String), countryCode: "MM", year: 2015 },
    ]);
  });

  it("los lista del más reciente al más antiguo (sin mes, al final de su año); cada persona ve solo los suyos", async () => {
    const { addTrip, listTrips } = setup();
    await addTrip({ userId: "ana", countryCode: "IT", year: 2019, month: 4 });
    await addTrip({ userId: "ana", countryCode: "JP", year: 2027, month: 3 });
    await addTrip({ userId: "ana", countryCode: "FR", year: 2019 });
    await addTrip({ userId: "luis", countryCode: "PT", year: 2020 });

    const listed = await listTrips("ana");

    expect(listed.ok && listed.value.map((trip) => trip.countryCode)).toEqual(["JP", "IT", "FR"]);
  });

  it("solo países de la lista cerrada: nada de texto libre", async () => {
    const { addTrip } = setup();

    for (const countryCode of ["ZZ", "mm", "Myanmar", "", "XKK"]) expect((await addTrip({ userId: "ana", countryCode, year: 2015 })).ok, countryCode).toBe(false);
    expect((await addTrip({ userId: "ana", countryCode: "XK", year: 2015 })).ok).toBe(true);
  });

  it("rechaza un año fuera de rango (antes de 1900, más de dos años vista) o un mes que no existe", async () => {
    const { addTrip } = setup();

    for (const [year, month] of [[1899, undefined], [2029, undefined], [2015.5, undefined], [2015, 0], [2015, 13], [2015, 2.5]] as const) {
      expect((await addTrip({ userId: "ana", countryCode: "MM", year, month })).ok, `${year}-${month}`).toBe(false);
    }
    expect((await addTrip({ userId: "ana", countryCode: "MM", year: 1900, month: 1 })).ok).toBe(true);
    expect((await addTrip({ userId: "ana", countryCode: "MM", year: 2028, month: 12 })).ok).toBe(true);
  });

  it("solo se borran los viajes propios", async () => {
    const { addTrip, deleteTrip, listTrips } = setup();
    const added = await addTrip({ userId: "ana", countryCode: "MM", year: 2015 });
    if (!added.ok) throw new Error("setup falló");

    expect((await deleteTrip({ userId: "luis", tripId: added.value.id })).ok).toBe(false);
    expect((await deleteTrip({ userId: "ana", tripId: added.value.id })).ok).toBe(true);
    const listed = await listTrips("ana");
    expect(listed.ok && listed.value).toEqual([]);
  });

  it("hay un tope de viajes por persona", async () => {
    const { addTrip } = setup();
    for (let count = 0; count < MAX_TRIPS_PER_USER; count += 1) await addTrip({ userId: "ana", countryCode: "MM", year: 2015 });

    expect((await addTrip({ userId: "ana", countryCode: "MM", year: 2015 })).ok).toBe(false);
  });
});
