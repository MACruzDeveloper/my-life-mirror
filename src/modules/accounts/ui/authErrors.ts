import type { TFunction } from "i18next";

/** Lo que responde la API cuando una acción de cuenta no sale bien. */
export interface AuthErrorBody {
  error?: string;
  code?: string;
}

/**
 * El mensaje que ve la persona, traducido, a partir del `code` del servidor.
 * Solo los casos que tienen texto propio; el resto, el mensaje del servidor o
 * el genérico de la pantalla.
 */
export function authErrorMessage(t: TFunction, data: AuthErrorBody, fallback: string): string {
  if (data.code === "RATE_LIMITED") return t("comun.demasiadosIntentos");
  if (data.code === "EMAIL_NOT_ACCEPTED") return t("registro.errorEmail");
  if (data.code === "WEAK_PASSWORD") return t("contrasena.noCumple");
  return data.error ?? fallback;
}
