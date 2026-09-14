import { describe, expect, it } from "vitest";
import { extraerTokenDeHash } from "@modules/cuentas/ui/extraerTokenDeHash";

describe("extraerTokenDeHash", () => {
  it("extrae el access_token del hash que envía Supabase", () => {
    expect(extraerTokenDeHash("#access_token=abc123&type=recovery")).toBe("abc123");
  });

  it("devuelve undefined si no hay access_token", () => {
    expect(extraerTokenDeHash("#type=recovery")).toBeUndefined();
  });

  it("devuelve undefined con un hash vacío", () => {
    expect(extraerTokenDeHash("")).toBeUndefined();
  });
});
