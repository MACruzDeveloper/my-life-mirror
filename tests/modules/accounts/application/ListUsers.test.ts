import { describe, expect, it } from "vitest";
import { createListUsers } from "@modules/accounts/application/ListUsers";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { ForbiddenError } from "@shared/domain/DomainError";

async function scenario() {
  const auth = new InMemoryAuthProvider();
  const admin = await auth.register("admin@ejemplo.com", "Bici-Azul-Lluvia-47");
  auth.assignRoleForTest("admin@ejemplo.com", "admin");
  const user = await auth.register("ana@ejemplo.com", "Bici-Azul-Lluvia-47");
  await auth.register("luis@ejemplo.com", "Bici-Azul-Lluvia-47");
  const profiles = new InMemoryProfileRepository();
  await profiles.save({ userId: user.id, name: "Ana" });
  return { listUsers: createListUsers(auth, profiles), admin: { ...admin, rol: "admin" as const }, usuario: user };
}

describe("ListUsers (ADM-01)", () => {
  it("un admin recibe todos los usuarios, del más reciente al más antiguo", async () => {
    const { listUsers, admin } = await scenario();

    const result = await listUsers(admin);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((u) => u.email)).toEqual(["luis@ejemplo.com", "ana@ejemplo.com", "admin@ejemplo.com"]);
      expect(result.value[2].rol).toBe("admin");
      expect(result.value[0]).not.toHaveProperty("password");
    }
  });

  it("un usuario normal recibe ForbiddenError y ningún dato", async () => {
    const { listUsers, usuario } = await scenario();

    const result = await listUsers(usuario);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ForbiddenError);
  });

  it("premium tampoco es admin", async () => {
    const { listUsers, usuario } = await scenario();

    const result = await listUsers({ ...usuario, rol: "premium" });

    expect(result.ok).toBe(false);
  });

  it("incluye el nombre del perfil cuando existe y si la cuenta está suspendida", async () => {
    const { listUsers, admin, usuario } = await scenario();

    const result = await listUsers(admin);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ana = result.value.find((u) => u.id === usuario.id);
      expect(ana?.name).toBe("Ana");
      expect(ana?.suspendido).toBe(false);
      expect(result.value.find((u) => u.email === "luis@ejemplo.com")?.name).toBeUndefined();
    }
  });
});
