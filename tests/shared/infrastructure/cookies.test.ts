import { describe, expect, it } from "vitest";
import { leerCookie } from "@shared/infrastructure/cookies";

describe("leerCookie", () => {
  it("extrae el valor de una cookie entre varias", () => {
    expect(leerCookie("a=1; sesion=abc123; b=2", "sesion")).toBe("abc123");
  });

  it("devuelve undefined si la cookie no está presente", () => {
    expect(leerCookie("a=1; b=2", "sesion")).toBeUndefined();
  });

  it("devuelve undefined si no hay cabecera de cookies", () => {
    expect(leerCookie(undefined, "sesion")).toBeUndefined();
  });
});
