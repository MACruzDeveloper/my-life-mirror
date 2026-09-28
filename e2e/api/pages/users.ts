import { randomUUID } from "node:crypto";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

/** Un usuario nuevo por test: los tests corren en paralelo sobre la misma base local. */
export function newUser(): TestUser {
  const id = randomUUID().slice(0, 8);
  return { name: `Prueba ${id}`, email: `e2e-${id}@example.com`, password: `clave-${id}-segura` };
}
