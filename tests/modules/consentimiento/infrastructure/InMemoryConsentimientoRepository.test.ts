import { describe, expect, it } from "vitest";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import type { Consentimiento } from "@modules/consentimiento/domain/Consentimiento";

function consentimiento(overrides: Partial<Consentimiento> = {}): Consentimiento {
  return { id: "1", usuarioId: "u1", categoriaId: "c1", versionPolitica: "2026-09", otorgadoEn: new Date("2026-09-19T10:00:00Z"), ...overrides };
}

describe("InMemoryConsentimientoRepository (RF-05)", () => {
  it("buscarPorUsuario devuelve solo los del usuario", async () => {
    const repo = new InMemoryConsentimientoRepository();
    await repo.guardar(consentimiento({ id: "1" }));
    await repo.guardar(consentimiento({ id: "2", usuarioId: "u2" }));

    expect((await repo.buscarPorUsuario("u1")).map((c) => c.id)).toEqual(["1"]);
  });

  it("eliminarPorUsuario borra los de ese usuario y no los de los demás", async () => {
    const repo = new InMemoryConsentimientoRepository();
    await repo.guardar(consentimiento({ id: "1" }));
    await repo.guardar(consentimiento({ id: "2", usuarioId: "u2" }));

    await repo.eliminarPorUsuario("u1");

    expect(await repo.buscarPorUsuario("u1")).toEqual([]);
    expect(await repo.buscarPorUsuario("u2")).toHaveLength(1);
  });
});
