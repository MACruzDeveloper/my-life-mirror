import { describe, expect, it } from "vitest";
import { redactPersonalData } from "@modules/recommendations/domain/redactPersonalData";

describe("redactPersonalData (RF-45): lo que se quita antes de enviar una experiencia a la IA", () => {
  it.each([
    ["un email", "Escribí a ana.lopez@correo.es para quedar", "Escribí a […] para quedar"],
    ["un enlace", "Leí https://ejemplo.com/ahorro y www.otro.es/x", "Leí […] y […]"],
    ["un teléfono con espacios", "Llámame al 612 34 56 78 mañana", "Llámame al […] mañana"],
    ["un teléfono con prefijo y guiones", "Mi número: +34 612-345-678.", "Mi número: […]."],
    ["un teléfono seguido", "Llama al 612345678", "Llama al […]"],
    ["un teléfono con puntos", "Llama al 612.34.56.78", "Llama al […]"],
    ["un número largo (cuenta, DNI…)", "La cuenta 12345678 tiene poco", "La cuenta […] tiene poco"],
  ])("quita %s", (_name, text, expected) => {
    expect(redactPersonalData(text)).toBe(expected);
  });

  it("deja lo que no es dato personal: cantidades, fechas y horas cortas", () => {
    const text = "Ahorré 150 euros el 3 de octubre, de 9 a 14 h, en 2026";
    expect(redactPersonalData(text)).toBe(text);
  });

  it.each(["El 06-10-2026 empecé", "El 06/10/2026 empecé", "El 6.10.2026 empecé", "Ahorré 1.200.000 en diez años", "Ahorré 12.500.000 en diez años", "Un piso de 250 000 euros"])(
    "deja las fechas y las cantidades con separadores, aunque sumen muchas cifras: %s",
    (text) => {
      expect(redactPersonalData(text)).toBe(text);
    },
  );

  it("no toca los nombres propios: no se pueden distinguir con fiabilidad (se avisa al usuario)", () => {
    expect(redactPersonalData("Quedé con Rosa en el parque")).toBe("Quedé con Rosa en el parque");
  });
});
