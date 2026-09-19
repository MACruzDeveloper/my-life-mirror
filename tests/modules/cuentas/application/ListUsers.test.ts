import { describe, expect, it } from "vitest";
import { createListUsers } from "@modules/cuentas/application/ListUsers";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";
import { ForbiddenError } from "@shared/domain/DomainError";

async function escenario() {
  const auth = new InMemoryAuthProvider();
  const admin = await auth.registrar("admin@ejemplo.com", "12345678");
  auth.asignarRolParaTest("admin@ejemplo.com", "admin");
  const usuario = await auth.registrar("ana@ejemplo.com", "12345678");
  await auth.registrar("luis@ejemplo.com", "12345678");
  return { listUsers: createListUsers(auth), admin: { ...admin, rol: "admin" as const }, usuario };
}

describe("ListUsers (ADM-01)", () => {
  it("un admin recibe todos los usuarios, del más reciente al más antiguo", async () => {
    const { listUsers, admin } = await escenario();

    const resultado = await listUsers(admin);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.map((u) => u.email)).toEqual(["luis@ejemplo.com", "ana@ejemplo.com", "admin@ejemplo.com"]);
      expect(resultado.value[2].rol).toBe("admin");
      expect(resultado.value[0]).not.toHaveProperty("password");
    }
  });

  it("un usuario normal recibe ForbiddenError y ningún dato", async () => {
    const { listUsers, usuario } = await escenario();

    const resultado = await listUsers(usuario);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ForbiddenError);
  });

  it("premium tampoco es admin", async () => {
    const { listUsers, usuario } = await escenario();

    const resultado = await listUsers({ ...usuario, rol: "premium" });

    expect(resultado.ok).toBe(false);
  });
});
