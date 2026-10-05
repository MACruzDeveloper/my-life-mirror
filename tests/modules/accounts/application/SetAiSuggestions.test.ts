import { describe, expect, it } from "vitest";
import { createSetAiSuggestions } from "@modules/accounts/application/SetAiSuggestions";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import type { Clock } from "@shared/domain/Clock";

const clock: Clock = { now: () => new Date("2026-10-05T09:00:00Z") };

async function setup() {
  const profileRepository = new InMemoryProfileRepository();
  await profileRepository.save({ userId: "u1", name: "Ana", aiIdeasEnabled: true });
  return { profileRepository, setAiSuggestions: createSetAiSuggestions({ profileRepository, clock }) };
}

describe("SetAiSuggestions (RF-45)", () => {
  it("activarlo guarda la elección y cuándo se dio, sin tocar la de RF-40", async () => {
    const { setAiSuggestions, profileRepository } = await setup();

    expect((await setAiSuggestions({ userId: "u1", enabled: true })).ok).toBe(true);

    expect(await profileRepository.findByUserId("u1")).toMatchObject({ aiIdeasEnabled: true, aiSuggestionsEnabled: true, aiSuggestionsEnabledAt: "2026-10-05T09:00:00.000Z" });
  });

  it("desactivarlo quita la elección y la fecha", async () => {
    const { setAiSuggestions, profileRepository } = await setup();
    await setAiSuggestions({ userId: "u1", enabled: true });

    await setAiSuggestions({ userId: "u1", enabled: false });

    const profile = await profileRepository.findByUserId("u1");
    expect(profile?.aiSuggestionsEnabled).toBe(false);
    expect(profile?.aiSuggestionsEnabledAt).toBeUndefined();
  });

  it("sin perfil no hay nada que activar", async () => {
    const { setAiSuggestions } = await setup();

    const result = await setAiSuggestions({ userId: "nadie", enabled: true });

    expect(!result.ok && result.error.code).toBe("NOT_FOUND");
  });

  it("actualizar el resto del perfil conserva la elección", async () => {
    const { setAiSuggestions, profileRepository } = await setup();
    await setAiSuggestions({ userId: "u1", enabled: true });

    await createUpdateProfile(profileRepository)({ userId: "u1", name: "Ana María" });

    expect(await profileRepository.findByUserId("u1")).toMatchObject({ name: "Ana María", aiSuggestionsEnabled: true });
  });
});
