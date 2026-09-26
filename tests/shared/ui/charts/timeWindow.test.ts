import { describe, expect, it } from "vitest";
import { formatDate, monthLabel, periodWindow } from "@shared/ui/charts/timeWindow";

const date = (iso: string) => new Date(iso);
const NOW = date("2026-09-26T12:00:00");

describe("periodWindow (ventana de meses completos, común a varios gráficos)", () => {
  it("'12 meses' termina al final del mes actual y empieza 12 meses antes, en límites de mes", () => {
    const window = periodWindow("12m", 0, date("2025-03-10T00:00:00"), date("2026-09-18T00:00:00"), NOW);

    expect(window.start).toEqual(date("2025-10-01T00:00:00"));
    expect(window.end).toEqual(date("2026-10-01T00:00:00"));
    expect(window.canGoBack).toBe(true);
    expect(window.canGoForward).toBe(false);
  });

  it("retroceder un periodo desplaza la ventana entera y permite volver", () => {
    const window = periodWindow("6m", -1, date("2025-03-10T00:00:00"), date("2026-09-18T00:00:00"), NOW);

    expect(window.start).toEqual(date("2025-10-01T00:00:00"));
    expect(window.end).toEqual(date("2026-04-01T00:00:00"));
    expect(window.canGoForward).toBe(true);
  });

  it("no deja retroceder más allá del mes del primer dato", () => {
    expect(periodWindow("6m", 0, date("2026-06-02T00:00:00"), date("2026-09-18T00:00:00"), NOW).canGoBack).toBe(false);
  });

  it("'todo' va del mes del primer dato al final del mes actual, sin desplazamiento", () => {
    const window = periodWindow("all", 0, date("2025-03-10T00:00:00"), date("2026-09-18T00:00:00"), NOW);

    expect(window.start).toEqual(date("2025-03-01T00:00:00"));
    expect(window.end).toEqual(date("2026-10-01T00:00:00"));
    expect([window.canGoBack, window.canGoForward]).toEqual([false, false]);
  });
});

describe("monthLabel / formatDate", () => {
  it("mes abreviado, con el año solo en enero o en la primera etiqueta", () => {
    expect(monthLabel(date("2026-03-01T00:00:00").getTime(), "es", false)).toMatch(/^mar/i);
    expect(monthLabel(date("2026-01-01T00:00:00").getTime(), "es", false)).toMatch(/ene[\s\S]*2026/i);
    expect(monthLabel(date("2026-03-01T00:00:00").getTime(), "es", true)).toMatch(/mar[\s\S]*2026/i);
  });

  it("formatDate da día, mes abreviado y año", () => {
    expect(formatDate(date("2026-09-18T10:00:00"), "es")).toMatch(/18[\s\S]*sept[\s\S]*2026/i);
  });
});
