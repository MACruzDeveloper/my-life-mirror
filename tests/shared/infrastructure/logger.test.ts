import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@shared/infrastructure/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("info() escribe una línea JSON con timestamp, nivel y mensaje", () => {
    logger.info("algo pasó", { usuarioId: "1" });

    const salida = JSON.parse((console.log as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(salida.nivel).toBe("info");
    expect(salida.mensaje).toBe("algo pasó");
    expect(salida.usuarioId).toBe("1");
    expect(typeof salida.timestamp).toBe("string");
  });

  it("error() serializa un Error real (mensaje + stack), no un objeto vacío", () => {
    logger.error("fallo inesperado", new Error("boom"));

    const salida = JSON.parse((console.error as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(salida.nivel).toBe("error");
    expect(salida.error.mensaje).toBe("boom");
    expect(typeof salida.error.stack).toBe("string");
  });

  it("warn() usa console.warn", () => {
    logger.warn("cuidado");

    expect(console.warn).toHaveBeenCalledOnce();
  });
});
