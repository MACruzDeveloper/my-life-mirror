import { describe, expect, it } from "vitest";
import { InMemoryAttemptLimiter } from "@shared/infrastructure/InMemoryAttemptLimiter";

describe("límite de intentos por ventana de tiempo (SEC-02)", () => {
  const limit = { max: 3, windowSeconds: 60 };

  it("deja pasar hasta el máximo y corta el siguiente", async () => {
    const limiter = new InMemoryAttemptLimiter({ now: () => new Date("2026-10-11T10:00:10Z") });

    const results = [];
    for (let attempt = 0; attempt < 4; attempt++) results.push(await limiter.tryConsume("a", limit));

    expect(results).toEqual([true, true, true, false]);
  });

  it("cada clave cuenta por separado", async () => {
    const limiter = new InMemoryAttemptLimiter({ now: () => new Date("2026-10-11T10:00:10Z") });
    for (let attempt = 0; attempt < 3; attempt++) await limiter.tryConsume("a", limit);

    expect(await limiter.tryConsume("b", limit)).toBe(true);
  });

  it("al empezar la ventana siguiente se vuelve a contar desde cero", async () => {
    let now = new Date("2026-10-11T10:00:10Z");
    const limiter = new InMemoryAttemptLimiter({ now: () => now });
    for (let attempt = 0; attempt < 4; attempt++) await limiter.tryConsume("a", limit);

    now = new Date("2026-10-11T10:01:00Z");

    expect(await limiter.tryConsume("a", limit)).toBe(true);
  });
});
