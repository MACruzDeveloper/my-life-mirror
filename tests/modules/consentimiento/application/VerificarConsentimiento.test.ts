import { describe, expect, it } from "vitest";
import { crearOtorgarConsentimiento } from "@modules/consentimiento/application/OtorgarConsentimiento";
import { crearVerificarConsentimiento } from "@modules/consentimiento/application/VerificarConsentimiento";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import type { Clock } from "@shared/domain/Clock";

const relojFijo: Clock = { now: () => new Date("2026-09-14T10:00:00Z") };

describe("VerificarConsentimiento (RF-04)", () => {
  it("devuelve false si el usuario nunca otorgó consentimiento para esa categoría", async () => {
    const verificarConsentimiento = crearVerificarConsentimiento(new InMemoryConsentimientoRepository());

    const resultado = await verificarConsentimiento({
      usuarioId: "u1",
      categoriaId: "salud",
      versionPolitica: "2026-01",
    });

    expect(resultado).toEqual({ ok: true, value: false });
  });

  it("devuelve true tras otorgar el consentimiento para esa misma versión de política", async () => {
    const repo = new InMemoryConsentimientoRepository();
    const otorgarConsentimiento = crearOtorgarConsentimiento(repo, relojFijo);
    const verificarConsentimiento = crearVerificarConsentimiento(repo);
    await otorgarConsentimiento({ usuarioId: "u1", categoriaId: "salud", versionPolitica: "2026-01" });

    const resultado = await verificarConsentimiento({
      usuarioId: "u1",
      categoriaId: "salud",
      versionPolitica: "2026-01",
    });

    expect(resultado).toEqual({ ok: true, value: true });
  });

  it("devuelve false si la política cambió de versión desde que se otorgó", async () => {
    const repo = new InMemoryConsentimientoRepository();
    const otorgarConsentimiento = crearOtorgarConsentimiento(repo, relojFijo);
    const verificarConsentimiento = crearVerificarConsentimiento(repo);
    await otorgarConsentimiento({ usuarioId: "u1", categoriaId: "salud", versionPolitica: "2026-01" });

    const resultado = await verificarConsentimiento({
      usuarioId: "u1",
      categoriaId: "salud",
      versionPolitica: "2026-02",
    });

    expect(resultado).toEqual({ ok: true, value: false });
  });

  it("rechaza entradas vacías con un error de validación", async () => {
    const verificarConsentimiento = crearVerificarConsentimiento(new InMemoryConsentimientoRepository());

    const resultado = await verificarConsentimiento({ usuarioId: "", categoriaId: "salud", versionPolitica: "2026-01" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
