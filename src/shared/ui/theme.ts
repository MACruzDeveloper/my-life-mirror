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

/**
 * Tema oscuro de la cabecera (UX-06): fondo oscuro con texto claro. Sus botones,
 * textos secundarios y el menú de móvil (que se abre fuera de la cabecera pero
 * hereda este tema) toman los colores de aquí, sin estilos sueltos por componente.
 */
export const headerTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#9ED9C9" },
    background: { default: "#1E2B30", paper: "#24343A" },
  },
});
