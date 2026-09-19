import { describe, expect, it } from "vitest";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import type { Consentimiento } from "@modules/consentimiento/domain/Consentimiento";

function crearConsentimiento(overrides: Partial<Consentimiento> = {}): Consentimiento {
  return {
    id: "c1",
    usuarioId: "u1",
    categoriaId: "salud",
    versionPolitica: "2026-01",
    otorgadoEn: new Date("2026-09-14T00:00:00Z"),
    ...overrides,
  };
}

describe("InMemoryConsentimientoRepository", () => {
  it("no encuentra nada antes de guardar", async () => {
    const repo = new InMemoryConsentimientoRepository();

    const encontrado = await repo.buscar("u1", "salud", "2026-01");

    expect(encontrado).toBeUndefined();
  });

  it("encuentra un consentimiento guardado por usuario+categoría+versión exactos", async () => {
    const repo = new InMemoryConsentimientoRepository();
    await repo.guardar(crearConsentimiento());

    const encontrado = await repo.buscar("u1", "salud", "2026-01");

    expect(encontrado?.id).toBe("c1");
  });

  it("no encuentra un consentimiento de otra versión de política", async () => {
    const repo = new InMemoryConsentimientoRepository();
    await repo.guardar(crearConsentimiento({ versionPolitica: "2026-01" }));

    const encontrado = await repo.buscar("u1", "salud", "2026-02");

    expect(encontrado).toBeUndefined();
  });
});
