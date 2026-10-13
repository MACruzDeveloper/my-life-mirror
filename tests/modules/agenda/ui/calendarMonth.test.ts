import { describe, expect, it } from "vitest";
import { agendaItems, monthWeeks, shiftMonth } from "@modules/agenda/ui/calendarMonth";

describe("calendario: semanas de un mes (RF-48)", () => {
  it("octubre de 2026 empieza en jueves: semanas de lunes a domingo, con huecos al principio", () => {
    const weeks = monthWeeks(2026, 10);

    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.at(-1)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", null]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("febrero de 2027 (28 días, empieza en lunes) ocupa cuatro semanas justas", () => {
    expect(monthWeeks(2027, 2)).toHaveLength(4);
  });

  it("pasar de mes cruza el año", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 });
  });

  it("junta eventos e ideas guardadas con fecha, por día; las ideas sin fecha o no guardadas no entran", () => {
    const items = agendaItems(
      [{ id: "e1", title: "Boda", day: "2026-10-24", categoryIds: ["c1"] }],
      [
        { categoryId: "c1", templateKey: "economia.2", reaction: "saved", reactedAt: "", plannedFor: "2026-10-20" },
        { categoryId: "c1", templateKey: "economia.3", reaction: "saved", reactedAt: "" },
        { categoryId: "c1", templateKey: "economia.4", reaction: "done", reactedAt: "" },
      ],
    );

    expect(items.map((item) => [item.kind, item.day])).toEqual([
      ["idea", "2026-10-20"],
      ["event", "2026-10-24"],
    ]);
  });
});
