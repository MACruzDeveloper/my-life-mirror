import { QueryClient } from "@tanstack/react-query";

/**
 * Caché de datos del servidor para toda la interfaz. Los datos solo cambian
 * por acciones del propio usuario, que actualizan o invalidan su caché, así
 * que nunca caducan por tiempo (`staleTime` y `gcTime` infinitos): una
 * pantalla ya visitada se pinta al instante y NO vuelve a llamar a la API
 * hasta que una acción invalide esos datos o se recargue la página (la caché
 * vive en memoria). Coste asumido: un cambio hecho desde otro dispositivo, o
 * por el admin (p. ej. una categoría nueva), no aparece hasta recargar.
 * Al iniciar sesión se vacía (ver LoginForm/RegisterForm): nadie debe ver
 * datos en caché de otro usuario del mismo navegador. Sin reintentos
 * automáticos: un fallo de la API se le enseña al usuario en vez de esconderlo.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false, refetchOnWindowFocus: false } },
  });
}
