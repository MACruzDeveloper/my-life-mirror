import { describe, expect, it } from "vitest";
import { createAddEvent, createDeleteEvent, createListEvents } from "@modules/agenda/application/Events";
import { MAX_EVENTS_PER_USER, MAX_EVENT_CATEGORIES } from "@modules/agenda/domain/UserEvent";
import { InMemoryEventRepository } from "@modules/agenda/infrastructure/InMemoryEventRepository";
import { createListCategories } from "@modules/categories/application/ListCategories";
import { InMemoryCategoryCatalogRepository } from "@modules/categories/infrastructure/InMemoryCategoryCatalogRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";

async function setup() {
  const now = new Date("2026-10-13T10:00:00Z");
  const categoryRepository = new InMemoryCategoryRepository();
  const listCategories = createListCategories(categoryRepository, new InMemoryCategoryCatalogRepository());
  for (const userId of ["ana", "luis"]) await listCategories(userId);
  const categoryOf = async (userId: string, name: string) => (await categoryRepository.findByUserId(userId)).find((category) => category.name === name)!;
  const eventRepository = new InMemoryEventRepository();
  return {
    addEvent: createAddEvent({ eventRepository, categoryRepository, clock: { now: () => now } }),
    listEvents: createListEvents(eventRepository),
    deleteEvent: createDeleteEvent(eventRepository),
    categoryOf,
  };
}

describe("eventos propios (RF-48)", () => {
  it("añade un evento con título, día y varias categorías propias (una boda: vida social y familia)", async () => {
    const { addEvent, listEvents, categoryOf } = await setup();
    const social = await categoryOf("ana", "Vida social");
    const family = await categoryOf("ana", "Familia");

    const result = await addEvent({ userId: "ana", title: "  Boda de Marta  ", day: "2026-10-24", categoryIds: [social.id, family.id, social.id] });

    expect(result.ok).toBe(true);
    const listed = await listEvents("ana");
    expect(listed.ok && listed.value).toEqual([{ id: expect.any(String), title: "Boda de Marta", day: "2026-10-24", categoryIds: [social.id, family.id] }]);
  });

  it("las categorías son opcionales, y los eventos salen por día", async () => {
    const { addEvent, listEvents } = await setup();
    await addEvent({ userId: "ana", title: "Excursión", day: "2026-11-02" });
    await addEvent({ userId: "ana", title: "Cena", day: "2026-10-20" });

    const listed = await listEvents("ana");

    expect(listed.ok && listed.value.map((event) => event.title)).toEqual(["Cena", "Excursión"]);
    expect(listed.ok && listed.value[0].categoryIds).toEqual([]);
  });

  it("rechaza un título vacío o de más de 80 caracteres", async () => {
    const { addEvent } = await setup();

    expect((await addEvent({ userId: "ana", title: "   ", day: "2026-10-24" })).ok).toBe(false);
    expect((await addEvent({ userId: "ana", title: "x".repeat(81), day: "2026-10-24" })).ok).toBe(false);
    expect((await addEvent({ userId: "ana", title: "x".repeat(80), day: "2026-10-24" })).ok).toBe(true);
  });

  it("rechaza un día mal escrito, que no existe o fuera de rango (un año atrás, dos adelante)", async () => {
    const { addEvent } = await setup();

    for (const day of ["24/10/2026", "2026-02-30", "2025-10-01", "2028-11-01"]) expect((await addEvent({ userId: "ana", title: "Cena", day })).ok, day).toBe(false);
    // Un evento pasado reciente sí: se puede anotar algo que ya ocurrió.
    expect((await addEvent({ userId: "ana", title: "Cena", day: "2026-10-01" })).ok).toBe(true);
  });

  it("rechaza una categoría que no es de esa persona", async () => {
    const { addEvent, categoryOf } = await setup();
    const othersCategory = await categoryOf("luis", "Vida social");

    const own = await categoryOf("ana", "Vida social");

    const result = await addEvent({ userId: "ana", title: "Cena", day: "2026-10-24", categoryIds: [own.id, othersCategory.id] });

    expect(result.ok).toBe(false);
  });

  it("rechaza más categorías de las permitidas", async () => {
    const { addEvent, categoryOf } = await setup();
    const names = ["Finanzas", "Vida social", "Pareja", "Deporte", "Aventura", "Familia"];
    const categoryIds = await Promise.all(names.map(async (name) => (await categoryOf("ana", name)).id));
    expect(categoryIds).toHaveLength(MAX_EVENT_CATEGORIES + 1);

    expect((await addEvent({ userId: "ana", title: "Cena", day: "2026-10-24", categoryIds })).ok).toBe(false);
    expect((await addEvent({ userId: "ana", title: "Cena", day: "2026-10-24", categoryIds: categoryIds.slice(0, MAX_EVENT_CATEGORIES) })).ok).toBe(true);
  });

  it("cada persona ve solo los suyos, y solo puede borrar los suyos", async () => {
    const { addEvent, listEvents, deleteEvent } = await setup();
    const added = await addEvent({ userId: "ana", title: "Cena", day: "2026-10-24" });
    if (!added.ok) throw new Error("setup falló");

    expect((await listEvents("luis")).ok && (await listEvents("luis"))).toEqual({ ok: true, value: [] });
    expect((await deleteEvent({ userId: "luis", eventId: added.value.id })).ok).toBe(false);
    expect((await deleteEvent({ userId: "ana", eventId: added.value.id })).ok).toBe(true);
    const listed = await listEvents("ana");
    expect(listed.ok && listed.value).toEqual([]);
  });

  it("hay un tope de eventos por persona", async () => {
    const { addEvent } = await setup();
    for (let count = 0; count < MAX_EVENTS_PER_USER; count += 1) await addEvent({ userId: "ana", title: `Evento ${count}`, day: "2026-10-24" });

    expect((await addEvent({ userId: "ana", title: "Uno más", day: "2026-10-24" })).ok).toBe(false);
  });
});
