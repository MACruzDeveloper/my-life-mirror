import { describe, expect, it } from "vitest";
import { buildNotifications } from "@modules/panel/ui/notifications/notifications";

const NAMES = { c1: "Vida social", c2: "Familia", c3: "Economía" };
const NOW = new Date(2026, 9, 14, 12);

describe("avisos de la campana (dentro de la app)", () => {
  it("reúne los avisos que ya da la app: tras un evento, ideas con fecha que ha llegado y categorías sin revisar", () => {
    const items = buildNotifications({
      now: NOW,
      categoryNames: NAMES,
      dismissedFollowUps: [],
      events: [
        { id: "e1", title: "Boda de Marta", day: "2026-10-10", categoryIds: ["c1", "c2"] },
        { id: "e2", title: "Sin categoría", day: "2026-10-10", categoryIds: [] },
        { id: "e3", title: "Mañana", day: "2026-10-15", categoryIds: ["c1"] },
      ],
      reactions: [
        { categoryId: "c3", templateKey: "economia.2", reaction: "saved", reactedAt: "", plannedFor: "2026-10-14" },
        { categoryId: "c3", templateKey: "economia.3", reaction: "saved", reactedAt: "", plannedFor: "2026-10-20" },
        { categoryId: "c3", templateKey: "economia.4", reaction: "saved", reactedAt: "" },
      ],
      latestScores: [
        { categoryId: "c2", categoryName: "Familia", score: 6, recordedAt: "2026-08-01T10:00:00Z" },
        { categoryId: "c1", categoryName: "Vida social", score: 7, recordedAt: "2026-10-01T10:00:00Z" },
      ],
    });

    expect(items.map((item) => [item.kind, item.id])).toEqual([
      ["event", "event:e1"],
      ["idea", "idea:c3:economia.2"],
      ["stale", "stale:c2:2026-08-01T10:00:00Z"],
    ]);
    expect(items[0]).toMatchObject({ title: "Boda de Marta", categories: ["Vida social", "Familia"], link: "/perfil/entrevista" });
    expect(items[1]).toMatchObject({ category: "Economía", day: "2026-10-14", link: "/inicio" });
    expect(items[2]).toMatchObject({ category: "Familia", weeks: 10, link: "/perfil/entrevista" });
  });

  it("no repite la invitación de un evento que ya se cerró en Inicio", () => {
    const items = buildNotifications({ now: NOW, categoryNames: NAMES, dismissedFollowUps: ["e1"], events: [{ id: "e1", title: "Boda", day: "2026-10-10", categoryIds: ["c1"] }], reactions: [], latestScores: [] });

    expect(items).toEqual([]);
  });

  it("si el perfil está sin completar (sin avatar, profesión ni aficiones), invita a completarlo, el primero", () => {
    const base = { now: NOW, categoryNames: NAMES, dismissedFollowUps: [], events: [], reactions: [], latestScores: [] };

    const missing = buildNotifications({ ...base, profile: {} });
    expect(missing.map((item) => [item.kind, item.link])).toEqual([["profile", "/perfil"]]);
    // Con algo de lo que da más juego (un avatar, o profesión o aficiones), ya no; ni mientras el perfil no ha llegado.
    expect(buildNotifications({ ...base, profile: { avatarKey: "roundGlasses" } })).toEqual([]);
    expect(buildNotifications({ ...base, profile: { hobbies: ["deporte"] } })).toEqual([]);
    expect(buildNotifications({ ...base, profile: undefined })).toEqual([]);
  });
});
