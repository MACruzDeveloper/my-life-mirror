import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "@shared/domain/withTimeout";

describe("withTimeout", () => {
  it("devuelve lo que resuelve la promesa si llega a tiempo", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
  });

  it("falla con 'Tiempo agotado' si tarda más del límite, y no deja el temporizador colgado", async () => {
    vi.useFakeTimers();
    const slow = new Promise<string>(() => {});
    const result = withTimeout(slow, 8000);
    const assertion = expect(result).rejects.toThrow("Tiempo agotado (8000 ms)");
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("propaga el error de la promesa", async () => {
    await expect(withTimeout(Promise.reject(new Error("caído")), 100)).rejects.toThrow("caído");
  });
});
