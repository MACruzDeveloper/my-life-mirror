import { describe, expect, it } from "vitest";
import { InMemoryAiUsageLimiter } from "@modules/recommendations/infrastructure/InMemoryAiUsageLimiter";
import type { Clock } from "@shared/domain/Clock";

describe("InMemoryAiUsageLimiter (RF-40b: tope diario de IA por usuario)", () => {
  it("deja usar la IA hasta el tope del día; cada usuario tiene el suyo", async () => {
    const clock: Clock = { now: () => new Date("2026-10-12T10:00:00Z") };
    const limiter = new InMemoryAiUsageLimiter(2, clock);

    expect([await limiter.tryConsume("u1"), await limiter.tryConsume("u1"), await limiter.tryConsume("u1")]).toEqual([true, true, false]);
    expect(await limiter.tryConsume("u2")).toBe(true);
  });

  it("al día siguiente (UTC) vuelve a empezar", async () => {
    let now = new Date("2026-10-12T23:59:00Z");
    const limiter = new InMemoryAiUsageLimiter(1, { now: () => now });
    await limiter.tryConsume("u1");
    expect(await limiter.tryConsume("u1")).toBe(false);

    now = new Date("2026-10-13T00:01:00Z");

    expect(await limiter.tryConsume("u1")).toBe(true);
  });

  it("con un tope de 0 no deja nada", async () => {
    expect(await new InMemoryAiUsageLimiter(0, { now: () => new Date() }).tryConsume("u1")).toBe(false);
  });
});
