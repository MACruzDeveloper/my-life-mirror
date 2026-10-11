import { describe, expect, it } from "vitest";
import { resetPasswordUrl } from "@modules/accounts/infrastructure/resetPasswordUrl";

describe("dirección a la que vuelve el enlace de recuperación (RF-38)", () => {
  it("es la pantalla de elegir contraseña de la app", () => {
    expect(resetPasswordUrl("https://app.example")).toBe("https://app.example/restablecer-password");
  });

  // Fallo real (11 oct.): si no coincide letra a letra con la lista de Supabase, el enlace acaba en la portada.
  it.each(["https://app.example/", "https://app.example//", "  https://app.example  ", " https://app.example/ "])("tolera una barra final o espacios en APP_URL: '%s'", (appUrl) => {
    expect(resetPasswordUrl(appUrl)).toBe("https://app.example/restablecer-password");
  });
});
