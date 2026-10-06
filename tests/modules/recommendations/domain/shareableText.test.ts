import { describe, expect, it } from "vitest";
import { checkShareableText } from "@modules/recommendations/domain/shareableText";

describe("filtros antes de compartir una experiencia con otras personas (RF-43)", () => {
  it.each([
    "Apunto los gastos en una libreta cada domingo y me ha cambiado el mes",
    "Salir a caminar con mi hermana después de cenar me ayuda mucho",
    "Estaba fatal y me sentía un fracaso, pero cocinar los domingos me ayudó",
    "Cooking on Sundays really helps me",
  ])("deja compartir una experiencia normal, aunque cuente cómo se sentía (RES-09): %s", (text) => {
    expect(checkShareableText(text)).toEqual({ ok: true });
  });

  it.each(["Escríbeme a ana@example.com", "Llamadme al 600 123 456", "Lo cuento en https://blog.example.com", "Mi cuenta es 123456789"])("no deja compartir datos de contacto: %s", (text) => {
    expect(checkShareableText(text)).toEqual({ ok: false, reason: "contact" });
  });

  it.each(["Dejé la medicación y mejoré", "Ir a terapia me ayudó", "Invierte en bitcoin, a mí me fue bien", "My depression got better with pills"])("no deja compartir consejo de salud ni financiero (RES-05): %s", (text) => {
    expect(checkShareableText(text)).toEqual({ ok: false, reason: "health" });
  });

  it.each(["Mi jefe es un gilipollas y aun así ahorro", "My boss is an idiot"])("no deja compartir insultos: %s", (text) => {
    expect(checkShareableText(text)).toEqual({ ok: false, reason: "offensive" });
  });

  it("no usa los grupos de obligación ni de juicio del filtro de ideas: en una experiencia propia son normales", () => {
    expect(checkShareableText("Pensaba que debes ahorrar mucho, y no: con poco basta")).toEqual({ ok: true });
  });
});
