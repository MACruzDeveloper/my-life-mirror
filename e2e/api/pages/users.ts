import { randomUUID } from "node:crypto";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

/**
 * Un usuario nuevo por test: los tests corren en paralelo sobre la misma base local.
 * La contraseña cumple la política de SEC-01 (y por eso no lleva el `id`, que está en el email y en el nombre).
 */
export function newUser(): TestUser {
  const id = randomUUID().slice(0, 8);
  return { name: `Prueba ${id}`, email: `e2e-${id}@example.com`, password: "Clave-Segura-E2E-7x" };
}
