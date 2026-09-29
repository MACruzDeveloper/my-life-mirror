import { randomUUID } from "node:crypto";
import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";
import type { Clock } from "../../../shared/domain/Clock.js";
import type { Consentimiento } from "../domain/Consentimiento.js";
import type { ConsentimientoRepository } from "../domain/ConsentimientoRepository.js";

export interface OtorgarConsentimientoInput {
  usuarioId: string;
  categoriaId: string;
  versionPolitica: string;
}

/**
 * Caso de uso — RF-04. Se dispara como extensión al activar una categoría
 * marcada como dato sensible (ver docs/requirements-analysis/08_Diagrama_Secuencia_Consentimiento.md).
 * Idempotente para la misma versión de política: otorgarlo dos veces no crea
 * un duplicado, pero un cambio de `versionPolitica` sí exige (y crea) un
 * consentimiento nuevo — uno viejo no cubre una política distinta (RD-05).
 */
export function crearOtorgarConsentimiento(repositorio: ConsentimientoRepository, clock: Clock) {
  return async function otorgarConsentimiento(
    input: OtorgarConsentimientoInput,
  ): Promise<Result<Consentimiento, ValidationError>> {
    const usuarioId = input.usuarioId.trim();
    const categoriaId = input.categoriaId.trim();
    const versionPolitica = input.versionPolitica.trim();

    if (usuarioId.length === 0) return err(new ValidationError("El usuario es obligatorio"));
    if (categoriaId.length === 0) return err(new ValidationError("La categoría es obligatoria"));
    if (versionPolitica.length === 0) return err(new ValidationError("La versión de la política es obligatoria"));

    const existente = await repositorio.buscar(usuarioId, categoriaId, versionPolitica);
    if (existente) return ok(existente);

    const consentimiento: Consentimiento = {
      id: randomUUID(),
      usuarioId,
      categoriaId,
      versionPolitica,
      otorgadoEn: clock.now(),
    };
    await repositorio.guardar(consentimiento);
    return ok(consentimiento);
  };
}
