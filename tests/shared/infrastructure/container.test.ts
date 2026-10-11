import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppContext, getAppContext } from "@shared/infrastructure/container";

describe("container", () => {
  it("crearAppContext respeta el entorno explícito y da un Clock que funciona", () => {
    const context = createAppContext("test");

    expect(context.environment).toBe("test");
    expect(context.clock.now()).toBeInstanceOf(Date);
    expect(typeof context.registerUser).toBe("function");
    expect(typeof context.logIn).toBe("function");
    expect(typeof context.listUsers).toBe("function");
    expect(typeof context.listRecommendations).toBe("function");
    expect(typeof context.adminUsers.changeRole).toBe("function");
    expect(typeof context.grantConsent).toBe("function");
    expect(typeof context.checkConsent).toBe("function");
    expect(typeof context.updateProfile).toBe("function");
    expect(typeof context.getProfile).toBe("function");
    expect(typeof context.listCategories).toBe("function");
    expect(typeof context.activateCategory).toBe("function");
    expect(typeof context.deactivateCategory).toBe("function");
    expect(typeof context.recordAssessments).toBe("function");
    expect(typeof context.getLatestScores).toBe("function");
  });

  it("obtenerAppContext devuelve siempre la misma instancia (singleton por proceso)", () => {
    const first = getAppContext();
    const second = getAppContext();

    expect(first).toBe(second);
  });

  describe("proveedor de IA (RF-40, RF-40b)", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("sin AI_IDEAS_PROVIDER, la IA está apagada", () => {
      vi.stubEnv("AI_IDEAS_PROVIDER", "");

      expect(createAppContext("test").aiIdeasAvailable).toBe(false);
    });

    it("con 'fake', disponible sin clave ni servicios externos", () => {
      vi.stubEnv("AI_IDEAS_PROVIDER", "fake");
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      expect(createAppContext("test").aiIdeasAvailable).toBe(true);
    });

    it("con 'anthropic' y su clave, disponible", () => {
      vi.stubEnv("AI_IDEAS_PROVIDER", "anthropic");
      vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-clave-de-prueba");

      expect(createAppContext("test").aiIdeasAvailable).toBe(true);
    });

    it("con 'anthropic' pero sin clave, apagada (no se ofrece algo que no puede funcionar)", () => {
      vi.stubEnv("AI_IDEAS_PROVIDER", "anthropic");
      vi.stubEnv("ANTHROPIC_API_KEY", "");

      expect(createAppContext("test").aiIdeasAvailable).toBe(false);
    });

    it("con un proveedor desconocido, apagada", () => {
      vi.stubEnv("AI_IDEAS_PROVIDER", "otro");

      expect(createAppContext("test").aiIdeasAvailable).toBe(false);
    });
  });
});
