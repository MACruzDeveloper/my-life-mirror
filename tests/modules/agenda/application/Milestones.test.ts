import { describe, expect, it } from "vitest";
import { createAddMilestone, createDeleteMilestone, createListMilestones } from "@modules/agenda/application/Milestones";
import { MAX_MILESTONE_TITLE_LENGTH, MAX_MILESTONES_PER_USER } from "@modules/agenda/domain/Milestone";
import { InMemoryMilestoneRepository } from "@modules/agenda/infrastructure/InMemoryMilestoneRepository";

function setup() {
  const milestoneRepository = new InMemoryMilestoneRepository();
  const clock = { now: () => new Date("2026-10-16T10:00:00Z") };
  return {
    milestoneRepository,
    addMilestone: createAddMilestone({ milestoneRepository, clock }),
    listMilestones: createListMilestones(milestoneRepository),
    deleteMilestone: createDeleteMilestone(milestoneRepository),
  };
}

describe("hitos en las páginas de Aventura y Deporte (RF-49)", () => {
  it("guarda un hito con su categoría, su título y su año; el mes es opcional; el título, sin espacios de sobra", async () => {
    const { addMilestone, listMilestones } = setup();

    expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "  Media maratón de Valencia ", year: 2024, month: 11 })).ok).toBe(true);
    expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Primer 10K", year: 2019 })).ok).toBe(true);

    const listed = await listMilestones({ userId: "ana", categoryKey: "deporte" });
    expect(listed.ok && listed.value).toEqual([
      { id: expect.any(String), categoryKey: "deporte", title: "Media maratón de Valencia", year: 2024, month: 11 },
      { id: expect.any(String), categoryKey: "deporte", title: "Primer 10K", year: 2019 },
    ]);
  });

  it("cada página ve solo los suyos, y cada persona solo los propios; del más reciente al más antiguo", async () => {
    const { addMilestone, listMilestones } = setup();
    await addMilestone({ userId: "ana", categoryKey: "aventura", title: "Camino de Santiago", year: 2018 });
    await addMilestone({ userId: "ana", categoryKey: "aventura", title: "Salto en paracaídas", year: 2022, month: 5 });
    await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Primer 10K", year: 2019 });
    await addMilestone({ userId: "luis", categoryKey: "aventura", title: "Kilimanjaro", year: 2020 });

    const listed = await listMilestones({ userId: "ana", categoryKey: "aventura" });

    expect(listed.ok && listed.value.map((milestone) => milestone.title)).toEqual(["Salto en paracaídas", "Camino de Santiago"]);
  });

  it("solo en las categorías que tienen hitos", async () => {
    const { addMilestone, listMilestones } = setup();

    expect((await addMilestone({ userId: "ana", categoryKey: "economia", title: "Ahorré", year: 2020 })).ok).toBe(false);
    expect((await listMilestones({ userId: "ana", categoryKey: "economia" })).ok).toBe(false);
  });

  it("rechaza un título vacío o demasiado largo", async () => {
    const { addMilestone } = setup();

    for (const title of ["", "   ", "x".repeat(MAX_MILESTONE_TITLE_LENGTH + 1)]) expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title, year: 2020 })).ok, title).toBe(false);
    expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "x".repeat(MAX_MILESTONE_TITLE_LENGTH), year: 2020 })).ok).toBe(true);
  });

  it("es algo conseguido: del año 1900 al actual, con un mes que exista", async () => {
    const { addMilestone } = setup();

    for (const [year, month] of [[1899, undefined], [2027, undefined], [2020.5, undefined], [2020, 0], [2020, 13]] as const) {
      expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Hito", year, month })).ok, `${year}-${month}`).toBe(false);
    }
    expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Hito", year: 1900, month: 1 })).ok).toBe(true);
    expect((await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Hito", year: 2026, month: 12 })).ok).toBe(true);
  });

  it("tiene un tope por persona", async () => {
    const { addMilestone, milestoneRepository } = setup();
    for (let index = 0; index < MAX_MILESTONES_PER_USER; index++) {
      await milestoneRepository.save({ id: `m${index}`, userId: "ana", categoryKey: "deporte", title: "Hito", year: 2020, createdAt: new Date() });
    }

    expect((await addMilestone({ userId: "ana", categoryKey: "aventura", title: "Uno más", year: 2020 })).ok).toBe(false);
  });

  it("solo se borran los hitos propios", async () => {
    const { addMilestone, deleteMilestone, listMilestones } = setup();
    const added = await addMilestone({ userId: "ana", categoryKey: "deporte", title: "Primer 10K", year: 2019 });
    const id = added.ok ? added.value.id : "";

    expect((await deleteMilestone({ userId: "luis", milestoneId: id })).ok).toBe(false);
    expect((await deleteMilestone({ userId: "ana", milestoneId: id })).ok).toBe(true);
    const listed = await listMilestones({ userId: "ana", categoryKey: "deporte" });
    expect(listed.ok && listed.value).toEqual([]);
  });
});
