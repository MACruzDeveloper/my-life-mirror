import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

/** Orden de las capas: lo que va después gana. El CSS sin capa (`index.css`, `css/skin.css`) gana a todas. */
const LAYER_ORDER = "@layer theme, base, mui, components, utilities;";

/**
 * Tema de MUI y capas CSS: con `enableCssLayer`, todos los estilos de MUI (también
 * los `sx`) van en la capa `mui`, y cualquier CSS propio sin capa les gana sin
 * `!important` ni pelear con la especificidad (`.mi-clase`, `.MuiButton-root`).
 * Lo global (colores, tipografía, bordes) sigue en el tema; lo visual concreto,
 * en clases propias.
 */
export function StyleProviders({ children }: { children: ReactNode }) {
  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles={LAYER_ORDER} />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
