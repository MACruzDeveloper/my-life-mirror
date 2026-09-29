import { describe, expect, it } from "vitest";
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
});
