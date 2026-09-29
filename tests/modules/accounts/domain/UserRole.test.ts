import { describe, expect, it } from "vitest";
import { DEFAULT_ROLE, readRoleFromMetadata } from "@modules/accounts/domain/UserRole";

describe("leerRolDesdeMetadata (RNF-13)", () => {
  it("devuelve el rol cuando es uno de los válidos", () => {
    expect(readRoleFromMetadata({ rol: "admin" })).toBe("admin");
    expect(readRoleFromMetadata({ rol: "premium" })).toBe("premium");
    expect(readRoleFromMetadata({ rol: "usuario" })).toBe("usuario");
  });

  it(`devuelve "${DEFAULT_ROLE}" si no hay app_metadata`, () => {
    expect(readRoleFromMetadata(undefined)).toBe(DEFAULT_ROLE);
    expect(readRoleFromMetadata(null)).toBe(DEFAULT_ROLE);
  });

  it(`devuelve "${DEFAULT_ROLE}" ante un valor no reconocido (dato corrupto o manipulado)`, () => {
    expect(readRoleFromMetadata({ rol: "superadmin" })).toBe(DEFAULT_ROLE);
    expect(readRoleFromMetadata({ rol: 123 })).toBe(DEFAULT_ROLE);
    expect(readRoleFromMetadata({})).toBe(DEFAULT_ROLE);
  });
});
