import { type Result, err, ok } from "../../../shared/domain/Result.js";
import { ValidationError } from "../../../shared/domain/DomainError.js";
import type { ConsentimientoRepository } from "../domain/ConsentimientoRepository.js";

export interface VerificarConsentimientoInput {
  usuarioId: string;
  categoriaId: string;
  versionPolitica: string;
}

/**
 * Caso de uso de solo lectura — comprueba si el usuario ya otorgó
 * consentimiento para una categoría bajo la versión de política vigente.
 * Lo usará `ActivarCategoria` (RF-07) para decidir si mostrar el
 * modal de consentimiento o activar la categoría directamente.
 */
export function crearVerificarConsentimiento(repositorio: ConsentimientoRepository) {
  return async function verificarConsentimiento(
    input: VerificarConsentimientoInput,
  ): Promise<Result<boolean, ValidationError>> {
    const usuarioId = input.usuarioId.trim();
    const categoriaId = input.categoriaId.trim();
    const versionPolitica = input.versionPolitica.trim();

    if (usuarioId.length === 0) return err(new ValidationError("El usuario es obligatorio"));
    if (categoriaId.length === 0) return err(new ValidationError("La categoría es obligatoria"));
    if (versionPolitica.length === 0) return err(new ValidationError("La versión de la política es obligatoria"));

    const existente = await repositorio.buscar(usuarioId, categoriaId, versionPolitica);
    return ok(existente !== undefined);
  };
}
