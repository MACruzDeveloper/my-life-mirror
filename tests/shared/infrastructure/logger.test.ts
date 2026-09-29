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
    logger.info("algo pasó", { userId: "1" });

    const output = JSON.parse((console.log as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(output.level).toBe("info");
    expect(output.message).toBe("algo pasó");
    expect(output.userId).toBe("1");
    expect(typeof output.timestamp).toBe("string");
  });

  it("error() serializa un Error real (mensaje + stack), no un objeto vacío", () => {
    logger.error("fallo inesperado", new Error("boom"));

    const output = JSON.parse((console.error as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.error.message).toBe("boom");
    expect(typeof output.error.stack).toBe("string");
  });

  it("warn() usa console.warn", () => {
    logger.warn("cuidado");

    expect(console.warn).toHaveBeenCalledOnce();
  });
});
