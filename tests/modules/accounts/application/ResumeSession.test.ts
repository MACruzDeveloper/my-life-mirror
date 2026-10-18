import { describe, expect, it } from "vitest";
import { createResumeSession } from "@modules/accounts/application/ResumeSession";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";

async function setup() {
  const authProvider = new InMemoryAuthProvider();
  const user = await authProvider.register("ana@ejemplo.com", "Bici-Azul-Lluvia-47");
  const session = await authProvider.logIn("ana@ejemplo.com", "Bici-Azul-Lluvia-47");
  return { authProvider, user, session, resumeSession: createResumeSession(authProvider) };
}

describe("ResumeSession (SEC-05): la sesión se renueva sola", () => {
  it("con el token de acceso válido, el usuario, sin renovar nada", async () => {
    const { session, resumeSession } = await setup();

    const result = await resumeSession({ token: session.token, refreshToken: session.refreshToken });

    expect(result.ok && result.value.user.email).toBe("ana@ejemplo.com");
    expect(result.ok && result.value.renewed).toBeUndefined();
  });

  it("con el de acceso caducado y el de renovación válido, el usuario y tokens nuevos (el de renovación cambia y el viejo deja de valer)", async () => {
    const { authProvider, session, resumeSession } = await setup();
    authProvider.expireAccessTokens();

    const result = await resumeSession({ token: session.token, refreshToken: session.refreshToken });

    expect(result.ok).toBe(true);
    if (!result.ok || !result.value.renewed) throw new Error("debía renovarse");
    expect(result.value.user.email).toBe("ana@ejemplo.com");
    expect(result.value.renewed.token).not.toBe(session.token);
    expect(result.value.renewed.refreshToken).not.toBe(session.refreshToken);
    expect((await authProvider.verifySession(result.value.renewed.token)).email).toBe("ana@ejemplo.com");
    expect((await resumeSession({ token: undefined, refreshToken: session.refreshToken })).ok).toBe(false);
  });

  it("sin token de acceso (la cookie ya caducó), también renueva con el de renovación", async () => {
    const { session, resumeSession } = await setup();

    const result = await resumeSession({ token: undefined, refreshToken: session.refreshToken });

    expect(result.ok && result.value.renewed).toBeTruthy();
  });

  it("sin ninguno válido, rechaza", async () => {
    const { authProvider, resumeSession } = await setup();
    authProvider.expireAccessTokens();

    expect((await resumeSession({ token: undefined, refreshToken: undefined })).ok).toBe(false);
    expect((await resumeSession({ token: "caducado", refreshToken: "inventado" })).ok).toBe(false);
  });

  it("una cuenta suspendida no se renueva (ADM-03)", async () => {
    const { authProvider, user, session, resumeSession } = await setup();
    authProvider.expireAccessTokens();
    await authProvider.suspend(user.id);

    expect((await resumeSession({ token: session.token, refreshToken: session.refreshToken })).ok).toBe(false);
  });

  it("un fallo inesperado del proveedor al renovar no se disfraza de sesión no válida: se propaga (la plantilla lo convierte en un 500)", async () => {
    const { authProvider, session, resumeSession } = await setup();
    authProvider.expireAccessTokens();
    authProvider.refreshSession = async () => {
      throw new Error("Supabase no responde");
    };

    await expect(resumeSession({ token: session.token, refreshToken: session.refreshToken })).rejects.toThrow("Supabase no responde");
  });
});
