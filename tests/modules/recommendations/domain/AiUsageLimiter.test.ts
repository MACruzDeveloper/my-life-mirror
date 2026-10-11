import { describe, expect, it } from "vitest";
import { DEFAULT_AI_DAILY_LIMIT, parseAiDailyLimit } from "@modules/recommendations/domain/AiUsageLimiter";

describe("parseAiDailyLimit (RF-40b)", () => {
  it("un entero válido se respeta, también el 0 (IA configurada pero sin usos)", () => {
    expect(parseAiDailyLimit("15")).toBe(15);
    expect(parseAiDailyLimit(" 0 ")).toBe(0);
  });

  it.each([undefined, "", "muchos", "-3", "2.5"])("sin valor o con uno inválido, el tope por defecto: %s", (value) => {
    expect(parseAiDailyLimit(value)).toBe(DEFAULT_AI_DAILY_LIMIT);
  });
});
