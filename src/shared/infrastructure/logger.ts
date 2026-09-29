/**
 * Logging estructurado — ADR-08. Cada línea es un JSON en stdout/stderr,
 * capturado gratis por el visor de logs de Vercel; nada de SaaS externo
 * todavía (YAGNI, RES-03). No confundir con la auditoría de RNF-11
 * (RegistrarAuditoria, ADR-04 apartado 4) — eso es un registro de negocio en la
 * base de datos, esto es observabilidad operativa.
 */
type Nivel = "info" | "warn" | "error";

interface Campos {
  [clave: string]: unknown;
}

function serializarError(error: unknown): unknown {
  if (error instanceof Error) {
    return { mensaje: error.message, stack: error.stack };
  }
  return error;
}

function registrar(nivel: Nivel, mensaje: string, campos?: Campos) {
  const entrada = {
    timestamp: new Date().toISOString(),
    nivel,
    mensaje,
    ...campos,
  };
  const salida = nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.log;
  salida(JSON.stringify(entrada));
}

export const logger = {
  info: (mensaje: string, campos?: Campos) => registrar("info", mensaje, campos),
  warn: (mensaje: string, campos?: Campos) => registrar("warn", mensaje, campos),
  error: (mensaje: string, error?: unknown, campos?: Campos) =>
    registrar("error", mensaje, { ...campos, error: serializarError(error) }),
};
