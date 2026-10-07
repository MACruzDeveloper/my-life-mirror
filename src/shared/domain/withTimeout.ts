/**
 * Falla con "Tiempo agotado" si la promesa tarda más de `ms` (y limpia el
 * temporizador en cualquier caso). Lo usan los casos de uso que llaman a un
 * proveedor de IA (RF-40, RF-45), que nunca deben dejar al usuario esperando.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiempo agotado (${ms} ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
