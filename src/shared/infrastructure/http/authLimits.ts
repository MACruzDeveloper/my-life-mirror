import type { AttemptLimit } from "#shared/domain/AttemptLimiter.js";

const MINUTE = 60;
const HOUR = 60 * MINUTE;

/**
 * SEC-02: cuántos intentos admite cada acción pública, por IP y por cuenta.
 * Holgados para una persona que se equivoca varias veces y cortos para un
 * programa que prueba contraseñas: con 10 intentos por cuenta cada 15 minutos
 * hacen falta años para recorrer una lista de contraseñas comunes, y la
 * política de SEC-01 ya deja fuera las que estarían en esa lista.
 *
 * El tope por cuenta tiene un coste asumido: alguien puede gastar a propósito
 * los intentos de otra persona y dejarla 15 minutos sin poder entrar. Se
 * acepta: es un rato, no pierde nada, y la alternativa (contar solo por IP)
 * deja pasar al atacante que cambia de IP.
 */
export const AUTH_LIMITS = {
  login: { perIp: { max: 30, windowSeconds: 15 * MINUTE }, perIdentity: { max: 10, windowSeconds: 15 * MINUTE } },
  register: { perIp: { max: 5, windowSeconds: HOUR } },
  requestPasswordReset: { perIp: { max: 10, windowSeconds: HOUR }, perIdentity: { max: 3, windowSeconds: HOUR } },
  resetPassword: { perIp: { max: 10, windowSeconds: HOUR } },
} as const satisfies Record<string, { perIp: AttemptLimit; perIdentity?: AttemptLimit }>;

/** Longitudes máximas de lo que entra por los formularios públicos (SEC-03): lo que no cabe ni se procesa. */
export const MAX_EMAIL_LENGTH = 254;
/** Holgado: la política real (SEC-01) la aplica el dominio; esto solo evita procesar megas de texto. */
export const MAX_PASSWORD_INPUT_LENGTH = 200;
export const MAX_NAME_LENGTH = 100;
export const MAX_TOKEN_LENGTH = 4096;
/** Identificadores (un UUID ocupa 36), claves, idioma, zona horaria, fechas. */
export const MAX_ID_LENGTH = 100;
/** Textos libres: el dominio aplica el límite real de cada uno (una nota, 500); esto es el techo de entrada. */
export const MAX_TEXT_LENGTH = 2000;
/** Elementos de una lista de entrada (las puntuaciones de una entrevista: una por categoría, y hay una decena). */
export const MAX_LIST_LENGTH = 100;
