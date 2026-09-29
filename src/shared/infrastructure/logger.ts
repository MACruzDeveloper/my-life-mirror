/**
 * Logging estructurado — ADR-08. Cada línea es un JSON en stdout/stderr,
 * capturado gratis por el visor de logs de Vercel; nada de SaaS externo
 * todavía (YAGNI, RES-03). No confundir con la auditoría de RNF-11
 * (RegistrarAuditoria, ADR-04 apartado 4) — eso es un registro de negocio en la
 * base de datos, esto es observabilidad operativa.
 */
type LogLevel = "info" | "warn" | "error";

interface Fields {
  [key: string]: unknown;
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return error;
}

function write(level: LogLevel, message: string, fields?: Fields) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const output = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  output(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, fields?: Fields) => write("info", message, fields),
  warn: (message: string, fields?: Fields) => write("warn", message, fields),
  error: (message: string, error?: unknown, fields?: Fields) =>
    write("error", message, { ...fields, error: serializeError(error) }),
};
