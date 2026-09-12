import type { Clock } from "@shared/domain/Clock";
import { SystemClock } from "@shared/infrastructure/SystemClock";

/**
 * Composition Root — ADR-03 §3.4. Único lugar del sistema con permiso para
 * conocer implementaciones concretas de infraestructura y conectarlas a los
 * casos de uso. Lo usan las funciones de `api/`, nunca un componente de React
 * directamente (los casos de uso corren en el servidor, no en el navegador).
 */

export type Entorno = "dev" | "test" | "production";

function detectarEntorno(): Entorno {
  const valor = process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev";
  return valor === "test" || valor === "production" ? valor : "dev";
}

/**
 * Todo lo que un caso de uso puede necesitar del exterior, inyectado desde
 * aquí. Crece módulo a módulo a medida que se implementan los repositorios
 * reales (ver Sprint 1 en adelante, docs/project-management/01_Backlog_MVP.md)
 * — nunca se instancia un adaptador directamente dentro de un caso de uso.
 */
export interface AppContext {
  entorno: Entorno;
  clock: Clock;
  // Próximos, según avancen los sprints: usuarioRepository, categoriaRepository,
  // evaluacionRepository... En `dev`/`test` serán adaptadores en memoria; en
  // `production`, los `Mongo*Repository` de cada módulo (ADR-04).
}

export function crearAppContext(entorno: Entorno = detectarEntorno()): AppContext {
  // Clock es, por ahora, el único servicio real. Los tres entornos comparten
  // SystemClock hasta que un test necesite tiempo fijo — se añade un
  // FixedClock entonces, no antes (YAGNI, ADR-02 §2).
  return {
    entorno,
    clock: new SystemClock(),
  };
}

let contextoActual: AppContext | undefined;

/** Devuelve el AppContext del proceso, creándolo una sola vez. */
export function obtenerAppContext(): AppContext {
  if (!contextoActual) {
    contextoActual = crearAppContext();
  }
  return contextoActual;
}
