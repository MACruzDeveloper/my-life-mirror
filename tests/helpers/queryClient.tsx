import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Cliente nuevo por test (sin caché compartida entre tests) y sin reintentos, para que un fallo simulado se vea al momento. */
export function createTestClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
}

export function withClient(ui: ReactElement, client: QueryClient = createTestClient()): ReactElement {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}
