import { describe, expect, it } from "vitest";
import { retryOnUniqueViolation } from "@shared/infrastructure/retryOnUniqueViolation";

const UNIQUE_VIOLATION = { code: "23505", message: "duplicate key value violates unique constraint" };

describe("retryOnUniqueViolation", () => {
  it("si la escritura va bien a la primera, no repite", async () => {
    let calls = 0;
    const result = await retryOnUniqueViolation(async () => ({ error: (calls += 1, null) }));

    expect(result.error).toBeNull();
    expect(calls).toBe(1);
  });

  it("si choca con una fila que otra petición acaba de crear, repite y la segunda vez pasa", async () => {
    let calls = 0;
    const result = await retryOnUniqueViolation(async () => ({ error: (calls += 1) === 1 ? UNIQUE_VIOLATION : null }));

    expect(result.error).toBeNull();
    expect(calls).toBe(2);
  });

  it("otro error no se repite: se devuelve tal cual", async () => {
    let calls = 0;
    const failure = { code: "42501", message: "permission denied" };
    const result = await retryOnUniqueViolation(async () => ({ error: (calls += 1, failure) }));

    expect(result.error).toBe(failure);
    expect(calls).toBe(1);
  });

  it("si sigue chocando, se rinde tras tres intentos y devuelve el error", async () => {
    let calls = 0;
    const result = await retryOnUniqueViolation(async () => ({ error: (calls += 1, UNIQUE_VIOLATION) }));

    expect(result.error).toBe(UNIQUE_VIOLATION);
    expect(calls).toBe(3);
  });
});
