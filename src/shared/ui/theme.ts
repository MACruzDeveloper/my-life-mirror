import { createTheme } from "@mui/material/styles";

/**
 * Tema explícito en modo claro. Sin esto (y sin ThemeProvider/CssBaseline
 * en main.tsx), el `color-scheme: light` de index.css y los componentes de
 * MUI podían quedar desincronizados con el modo oscuro del navegador.
 */
export const theme = createTheme({
  palette: {
    mode: "light",
  },
});
