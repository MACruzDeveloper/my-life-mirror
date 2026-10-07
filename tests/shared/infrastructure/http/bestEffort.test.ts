import { describe, expect, it } from "vitest";
import { bestEffort } from "@shared/infrastructure/http/bestEffort";
import { err, ok } from "@shared/domain/Result";
import { ValidationError } from "@shared/domain/DomainError";

describe("bestEffort: lecturas que acompañan a una respuesta y no deben estropearla (PERF-01)", () => {
  it("devuelve el valor si la lectura va bien", async () => {
    expect(await bestEffort(async () => ok([1, 2]))).toEqual([1, 2]);
  });

  it("undefined si la lectura devuelve un error de negocio", async () => {
    expect(await bestEffort(async () => err(new ValidationError("no")))).toBeUndefined();
  });

  it("undefined (y avisa) si la lectura lanza, p. ej. un fallo pasajero de Supabase", async () => {
    const warnings: unknown[] = [];

    const value = await bestEffort(async () => {
      throw new Error("Supabase caído");
    }, (error) => warnings.push(error));

    expect(value).toBeUndefined();
    expect(warnings).toEqual([new Error("Supabase caído")]);
  });
});
