import { describe, expect, it } from "vitest";
import { clearedSessionCookies, readCookie, sessionCookies } from "@shared/infrastructure/cookies";

describe("leerCookie", () => {
  it("extrae el valor de una cookie entre varias", () => {
    expect(readCookie("a=1; sesion=abc123; b=2", "sesion")).toBe("abc123");
  });

  it("devuelve undefined si la cookie no está presente", () => {
    expect(readCookie("a=1; b=2", "sesion")).toBeUndefined();
  });

  it("devuelve undefined si no hay cabecera de cookies", () => {
    expect(readCookie(undefined, "sesion")).toBeUndefined();
  });
});

describe("cookies de sesión (SEC-05)", () => {
  it("dos cookies HttpOnly, Secure y SameSite: la de acceso, una hora; la de renovación, dos días y solo para /api", () => {
    const [access, refresh] = sessionCookies({ token: "acc", refreshToken: "ref" });

    expect(access).toMatch(/^sesion=acc; /);
    expect(access).toContain("Max-Age=3600");
    expect(access).toContain("Path=/;");
    expect(refresh).toMatch(/^sesion_renovar=ref; /);
    expect(refresh).toContain(`Max-Age=${2 * 24 * 60 * 60}`);
    expect(refresh).toContain("Path=/api");
    for (const cookie of [access, refresh]) for (const attribute of ["HttpOnly", "Secure", "SameSite=Lax"]) expect(cookie).toContain(attribute);
  });

  it("cerrar sesión borra las dos, en las mismas rutas", () => {
    const [access, refresh] = clearedSessionCookies();

    expect(access).toMatch(/^sesion=; .*Path=\/;.*Max-Age=0/);
    expect(refresh).toMatch(/^sesion_renovar=; .*Path=\/api;.*Max-Age=0/);
  });
});
