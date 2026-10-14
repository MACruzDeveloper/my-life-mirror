import { createContext, useContext, type ReactNode } from "react";

interface HeaderExtras {
  /** La campana de avisos: la pone quien conoce los datos (un módulo), no la cabecera compartida. */
  notifications?: ReactNode;
}

const HeaderExtrasContext = createContext<HeaderExtras>({});

/**
 * Lo que la cabecera compartida enseña sin saber de dónde sale. `shared/` no
 * importa módulos de negocio: los avisos los monta la ruta protegida (módulo
 * `accounts`) y la cabecera solo los coloca.
 */
export function HeaderExtrasProvider({ notifications, children }: HeaderExtras & { children: ReactNode }) {
  return <HeaderExtrasContext.Provider value={{ notifications }}>{children}</HeaderExtrasContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook de contexto, convención habitual junto a su Provider.
export function useHeaderExtras(): HeaderExtras {
  return useContext(HeaderExtrasContext);
}
