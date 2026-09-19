import { describe, expect, it } from "vitest";
import type { Clock } from "@shared/domain/Clock";
import { crearOtorgarConsentimiento } from "@modules/consentimiento/application/OtorgarConsentimiento";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";

const FECHA_FIJA = new Date("2026-09-14T10:00:00Z");
const relojFijo: Clock = { now: () => FECHA_FIJA };

describe("OtorgarConsentimiento (RF-04)", () => {
  it("crea un consentimiento nuevo con la fecha del reloj inyectado", async () => {
    const otorgarConsentimiento = crearOtorgarConsentimiento(new InMemoryConsentimientoRepository(), relojFijo);

    const resultado = await otorgarConsentimiento({
      usuarioId: "u1",
      categoriaId: "salud",
      versionPolitica: "2026-01",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.usuarioId).toBe("u1");
      expect(resultado.value.categoriaId).toBe("salud");
      expect(resultado.value.versionPolitica).toBe("2026-01");
      expect(resultado.value.otorgadoEn).toEqual(FECHA_FIJA);
    }
  });

  it("es idempotente: otorgarlo dos veces bajo la misma política no crea un duplicado", async () => {
    const repo = new InMemoryConsentimientoRepository();
    const otorgarConsentimiento = crearOtorgarConsentimiento(repo, relojFijo);
    const input = { usuarioId: "u1", categoriaId: "salud", versionPolitica: "2026-01" };

    const primero = await otorgarConsentimiento(input);
    const segundo = await otorgarConsentimiento(input);

    expect(primero.ok && segundo.ok).toBe(true);
    if (primero.ok && segundo.ok) {
      expect(segundo.value.id).toBe(primero.value.id);
    }
  });

  it("un cambio de versión de política exige (y crea) un consentimiento nuevo", async () => {
    const repo = new InMemoryConsentimientoRepository();
    const otorgarConsentimiento = crearOtorgarConsentimiento(repo, relojFijo);
    const primero = await otorgarConsentimiento({ usuarioId: "u1", categoriaId: "salud", versionPolitica: "2026-01" });

    const segundo = await otorgarConsentimiento({ usuarioId: "u1", categoriaId: "salud", versionPolitica: "2026-02" });

    expect(primero.ok && segundo.ok).toBe(true);
    if (primero.ok && segundo.ok) {
      expect(segundo.value.id).not.toBe(primero.value.id);
    }
  });

  it.each([
    { usuarioId: "", categoriaId: "salud", versionPolitica: "2026-01" },
    { usuarioId: "u1", categoriaId: "", versionPolitica: "2026-01" },
    { usuarioId: "u1", categoriaId: "salud", versionPolitica: "" },
  ])("rechaza entradas vacías sin llegar al repositorio (%o)", async (input) => {
    const otorgarConsentimiento = crearOtorgarConsentimiento(new InMemoryConsentimientoRepository(), relojFijo);

    const resultado = await otorgarConsentimiento(input);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
