import { describe, expect, it } from "vitest";
import { extractTokenFromHash } from "@modules/accounts/ui/extractTokenFromHash";

describe("extraerTokenDeHash", () => {
  it("extrae el access_token del hash que envía Supabase", () => {
    expect(extractTokenFromHash("#access_token=abc123&type=recovery")).toBe("abc123");
  });

  it("devuelve undefined si no hay access_token", () => {
    expect(extractTokenFromHash("#type=recovery")).toBeUndefined();
  });

  it("devuelve undefined con un hash vacío", () => {
    expect(extractTokenFromHash("")).toBeUndefined();
  });
});
