import { describe, expect, it } from "vitest";
import { extractTokenFromHash, isRecoveryHash } from "@modules/accounts/ui/extractTokenFromHash";

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

describe("isRecoveryHash: ¿viene la persona de un enlace de recuperación? (RF-38)", () => {
  it.each([
    "#access_token=abc123&expires_in=3600&token_type=bearer&type=recovery",
    "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
  ])("sí, con el token o con el error de un enlace gastado: %s", (hash) => {
    expect(isRecoveryHash(hash)).toBe(true);
  });

  it.each(["", "#", "#como-funciona", "#access_token=abc123", "#type=signup&access_token=abc"])("no, con cualquier otro hash: '%s'", (hash) => {
    expect(isRecoveryHash(hash)).toBe(false);
  });
});
