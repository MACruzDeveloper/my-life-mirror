import { describe, expect, it } from "vitest";
import { createSetAiIdeas } from "@modules/accounts/application/SetAiIdeas";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { InMemoryPersonalizedIdeaRepository } from "@modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository";
import type { Clock } from "@shared/domain/Clock";

const clock: Clock = { now: () => new Date("2026-10-02T09:00:00Z") };

async function setup() {
  const profileRepository = new InMemoryProfileRepository();
  const personalizedIdeaRepository = new InMemoryPersonalizedIdeaRepository();
  await profileRepository.save({ userId: "u1", name: "Ana" });
  return { profileRepository, personalizedIdeaRepository, setAiIdeas: createSetAiIdeas({ profileRepository, personalizedIdeaRepository, clock }) };
}

describe("SetAiIdeas (RF-40)", () => {
  it("activarlo guarda la elección y cuándo se dio", async () => {
    const { setAiIdeas, profileRepository } = await setup();

    const result = await setAiIdeas({ userId: "u1", enabled: true });

    expect(result.ok).toBe(true);
    expect(await profileRepository.findByUserId("u1")).toMatchObject({ name: "Ana", aiIdeasEnabled: true, aiIdeasEnabledAt: "2026-10-02T09:00:00.000Z" });
  });

  it("desactivarlo quita la fecha y borra las ideas ya personalizadas", async () => {
    const { setAiIdeas, profileRepository, personalizedIdeaRepository } = await setup();
    await setAiIdeas({ userId: "u1", enabled: true });
    await personalizedIdeaRepository.save({ recommendationId: "r1", userId: "u1", locale: "es", templateKey: "economia.1", text: "…", model: "fake", createdAt: clock.now() });

    await setAiIdeas({ userId: "u1", enabled: false });

    const profile = await profileRepository.findByUserId("u1");
    expect(profile?.aiIdeasEnabled).toBe(false);
    expect(profile?.aiIdeasEnabledAt).toBeUndefined();
    expect(await personalizedIdeaRepository.findByUserId("u1")).toEqual([]);
  });

  it("sin perfil no hay nada que activar", async () => {
    const { setAiIdeas } = await setup();

    const result = await setAiIdeas({ userId: "otro", enabled: true });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("actualizar el resto del perfil conserva la elección", async () => {
    const { setAiIdeas, profileRepository } = await setup();
    await setAiIdeas({ userId: "u1", enabled: true });

    await createUpdateProfile(profileRepository)({ userId: "u1", name: "Ana María", timeZone: "Europe/Madrid" });

    expect(await profileRepository.findByUserId("u1")).toMatchObject({ name: "Ana María", aiIdeasEnabled: true, aiIdeasEnabledAt: "2026-10-02T09:00:00.000Z" });
  });
});
