import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// Efecto secundario: inicializa i18next (RNF-10) para que cualquier
// componente que use useTranslation() tenga el idioma listo en los tests,
// igual que main.tsx lo inicializa antes de montar <App />.
import "@shared/ui/i18n";

// Sin esto, los componentes montados en un test de React siguen en el DOM
// en el siguiente test (no usamos test.globals, así que RTL no detecta el
// framework automáticamente para auto-limpiar).
afterEach(() => {
  cleanup();
});
