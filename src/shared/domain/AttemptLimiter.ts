/** Cuántos intentos se admiten en una ventana de tiempo. */
export interface AttemptLimit {
  readonly max: number;
  readonly windowSeconds: number;
}

/**
 * SEC-02: tope de intentos por clave y ventana de tiempo, para que nadie pueda
 * probar contraseñas (o crear cuentas, o pedir correos) sin freno. La clave la
 * decide quien llama (una IP, un email…), ya resumida: aquí no llegan datos
 * personales. Puerto — ADR-03 apartado 3.3.
 */
export interface AttemptLimiter {
  /** Cuenta un intento si quedan en la ventana actual; `false` si ya se agotaron (y no cuenta nada). */
  tryConsume(key: string, limit: AttemptLimit): Promise<boolean>;
}
