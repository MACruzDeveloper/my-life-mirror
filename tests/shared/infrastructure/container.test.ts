import { describe, expect, it } from "vitest";
import { crearAppContext, obtenerAppContext } from "@shared/infrastructure/container";

describe("container", () => {
  it("crearAppContext respeta el entorno explícito y da un Clock que funciona", () => {
    const contexto = crearAppContext("test");

    expect(contexto.entorno).toBe("test");
    expect(contexto.clock.now()).toBeInstanceOf(Date);
  });

  it("obtenerAppContext devuelve siempre la misma instancia (singleton por proceso)", () => {
    const primera = obtenerAppContext();
    const segunda = obtenerAppContext();

    expect(primera).toBe(segunda);
  });
});
