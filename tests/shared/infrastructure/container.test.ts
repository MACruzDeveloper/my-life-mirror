import { describe, expect, it } from "vitest";
import { crearAppContext, obtenerAppContext } from "@shared/infrastructure/container";

describe("container", () => {
  it("crearAppContext respeta el entorno explícito y da un Clock que funciona", () => {
    const contexto = crearAppContext("test");

    expect(contexto.entorno).toBe("test");
    expect(contexto.clock.now()).toBeInstanceOf(Date);
    expect(typeof contexto.registerUser).toBe("function");
    expect(typeof contexto.iniciarSesion).toBe("function");
    expect(typeof contexto.otorgarConsentimiento).toBe("function");
    expect(typeof contexto.verificarConsentimiento).toBe("function");
    expect(typeof contexto.updateProfile).toBe("function");
    expect(typeof contexto.getProfile).toBe("function");
    expect(typeof contexto.listCategories).toBe("function");
    expect(typeof contexto.activateCategory).toBe("function");
    expect(typeof contexto.deactivateCategory).toBe("function");
  });

  it("obtenerAppContext devuelve siempre la misma instancia (singleton por proceso)", () => {
    const primera = obtenerAppContext();
    const segunda = obtenerAppContext();

    expect(primera).toBe(segunda);
  });
});
