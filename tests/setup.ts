import { afterEach } from "vitest";
import { cleanup, configure } from "@testing-library/react";
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

// `findBy*` / `waitFor` esperan 1 s por defecto. Con toda la batería en
// paralelo, algunos flujos asíncronos (el consentimiento de la entrevista,
// los gráficos de Inicio, que se cargan en diferido) a veces tardaban algo
// más y fallaban de forma intermitente (≈1 de cada 5 ejecuciones completas),
// aunque pasaban siempre aislados. 3 s da margen sin ocultar fallos reales:
// un error de verdad sigue fallando, solo que tras 3 s.
configure({ asyncUtilTimeout: 3000 });
