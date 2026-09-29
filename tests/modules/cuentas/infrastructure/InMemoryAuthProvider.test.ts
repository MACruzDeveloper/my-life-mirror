import { describe, expect, it } from "vitest";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";
import { AuthenticationError, ConflictError } from "@shared/domain/DomainError";

describe("InMemoryAuthProvider", () => {
  it("registra un usuario nuevo", async () => {
    const provider = new InMemoryAuthProvider();

    const usuario = await provider.registrar("ana@ejemplo.com", "12345678");

    expect(usuario.email).toBe("ana@ejemplo.com");
  });

  it("lanza ConflictError si el email ya está registrado", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");

    await expect(provider.registrar("ana@ejemplo.com", "otraClave123")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("inicia sesión con credenciales correctas y devuelve un token", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");

    const sesion = await provider.iniciarSesion("ana@ejemplo.com", "12345678");

    expect(sesion.email).toBe("ana@ejemplo.com");
    expect(typeof sesion.token).toBe("string");
  });

  it("lanza AuthenticationError con contraseña incorrecta", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");

    await expect(provider.iniciarSesion("ana@ejemplo.com", "incorrecta")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("lanza AuthenticationError si el email no existe", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.iniciarSesion("nadie@ejemplo.com", "12345678")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("verificarSesion devuelve el usuario dueño de un token válido", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");
    const sesion = await provider.iniciarSesion("ana@ejemplo.com", "12345678");

    const usuario = await provider.verificarSesion(sesion.token);

    expect(usuario.email).toBe("ana@ejemplo.com");
  });

  it("verificarSesion lanza AuthenticationError con un token que no existe", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.verificarSesion("token-inventado")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("registra con el rol 'usuario' por defecto (RNF-13) — nadie se autoasigna admin/premium", async () => {
    const provider = new InMemoryAuthProvider();

    const usuario = await provider.registrar("ana@ejemplo.com", "12345678");

    expect(usuario.rol).toBe("usuario");
  });

  it("asignarRolParaTest permite simular un usuario admin/premium en los tests", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");

    provider.asignarRolParaTest("ana@ejemplo.com", "admin");
    const sesion = await provider.iniciarSesion("ana@ejemplo.com", "12345678");
    const usuario = await provider.verificarSesion(sesion.token);

    expect(usuario.rol).toBe("admin");
  });

  it("solicitarRecuperacion no lanza ni para un email existente ni para uno inexistente", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");

    await expect(provider.solicitarRecuperacion("ana@ejemplo.com")).resolves.toBeUndefined();
    await expect(provider.solicitarRecuperacion("nadie@ejemplo.com")).resolves.toBeUndefined();
  });

  it("restablecerPassword cambia la contraseña y permite iniciar sesión con la nueva", async () => {
    const provider = new InMemoryAuthProvider();
    await provider.registrar("ana@ejemplo.com", "12345678");
    await provider.solicitarRecuperacion("ana@ejemplo.com");
    const token = provider.tokenDeRecuperacionParaTest("ana@ejemplo.com");

    await provider.restablecerPassword(token!, "nuevaClave123");

    const sesion = await provider.iniciarSesion("ana@ejemplo.com", "nuevaClave123");
    expect(sesion.email).toBe("ana@ejemplo.com");
  });

  it("restablecerPassword lanza AuthenticationError con un token inválido", async () => {
    const provider = new InMemoryAuthProvider();

    await expect(provider.restablecerPassword("token-inventado", "nuevaClave123")).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});
