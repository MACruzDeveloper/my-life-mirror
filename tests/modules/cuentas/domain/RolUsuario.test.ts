import { describe, expect, it } from "vitest";
import { ROL_POR_DEFECTO, leerRolDesdeMetadata } from "@modules/cuentas/domain/RolUsuario";

describe("leerRolDesdeMetadata (RNF-13)", () => {
  it("devuelve el rol cuando es uno de los válidos", () => {
    expect(leerRolDesdeMetadata({ rol: "admin" })).toBe("admin");
    expect(leerRolDesdeMetadata({ rol: "premium" })).toBe("premium");
    expect(leerRolDesdeMetadata({ rol: "usuario" })).toBe("usuario");
  });

  it(`devuelve "${ROL_POR_DEFECTO}" si no hay app_metadata`, () => {
    expect(leerRolDesdeMetadata(undefined)).toBe(ROL_POR_DEFECTO);
    expect(leerRolDesdeMetadata(null)).toBe(ROL_POR_DEFECTO);
  });

  it(`devuelve "${ROL_POR_DEFECTO}" ante un valor no reconocido (dato corrupto o manipulado)`, () => {
    expect(leerRolDesdeMetadata({ rol: "superadmin" })).toBe(ROL_POR_DEFECTO);
    expect(leerRolDesdeMetadata({ rol: 123 })).toBe(ROL_POR_DEFECTO);
    expect(leerRolDesdeMetadata({})).toBe(ROL_POR_DEFECTO);
  });
});
