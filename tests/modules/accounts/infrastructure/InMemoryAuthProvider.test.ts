import { describe, expect, it } from "vitest";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";
import { AuthenticationError, ConflictError } from "@shared/domain/DomainError";

describe("InMemoryAuthProvider", () => {
  it("registra un usuario nuevo", async () => {
    const provider = new InMemoryAuthProvider();

    const user = await provider.register("ana@ejemplo.com", "12345678");

    expect(user.email).toBe("ana@ejemplo.com");
  });

  it("lanza ConflictError si el email ya está registrado", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");

    await expect(provider.register("ana@ejemplo.com", "otraClave123")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("inicia sesión con credenciales correctas y devuelve un token", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");

    const session = await provider.logIn("ana@ejemplo.com", "12345678");

    expect(session.email).toBe("ana@ejemplo.com");
    expect(typeof session.token).toBe("string");
  });

  it("lanza AuthenticationError con contraseña incorrecta", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");

    await expect(provider.logIn("ana@ejemplo.com", "incorrecta")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("lanza AuthenticationError si el email no existe", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.logIn("nadie@ejemplo.com", "12345678")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("verificarSesion devuelve el usuario dueño de un token válido", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");
    const session = await provider.logIn("ana@ejemplo.com", "12345678");

    const user = await provider.verifySession(session.token);

    expect(user.email).toBe("ana@ejemplo.com");
  });

  it("verificarSesion lanza AuthenticationError con un token que no existe", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.verifySession("token-inventado")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("registra con el rol 'usuario' por defecto (RNF-13) — nadie se autoasigna admin/premium", async () => {
    const provider = new InMemoryAuthProvider();

    const user = await provider.register("ana@ejemplo.com", "12345678");

    expect(user.rol).toBe("usuario");
  });

  it("asignarRolParaTest permite simular un usuario admin/premium en los tests", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");

    provider.assignRoleForTest("ana@ejemplo.com", "admin");
    const session = await provider.logIn("ana@ejemplo.com", "12345678");
    const user = await provider.verifySession(session.token);

    expect(user.rol).toBe("admin");
  });

  it("solicitarRecuperacion no lanza ni para un email existente ni para uno inexistente", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");

    await expect(provider.requestPasswordReset("ana@ejemplo.com")).resolves.toBeUndefined();
    await expect(provider.requestPasswordReset("nadie@ejemplo.com")).resolves.toBeUndefined();
  });

  it("restablecerPassword cambia la contraseña y permite iniciar sesión con la nueva", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.register("ana@ejemplo.com", "12345678");
    await provider.requestPasswordReset("ana@ejemplo.com");
    const token = provider.resetTokenForTest("ana@ejemplo.com");

    await provider.resetPassword(token!, "nuevaClave123");

    const session = await provider.logIn("ana@ejemplo.com", "nuevaClave123");
    expect(session.email).toBe("ana@ejemplo.com");
  });

  it("restablecerPassword lanza AuthenticationError con un token inválido", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.resetPassword("token-inventado", "nuevaClave123")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});
