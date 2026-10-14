import { createTheme } from "@mui/material/styles";

/**
 * La paleta de la app (elegida por el autor, 12 oct. 2026): cinco tonos, del
 * azul noche al casi negro. Son los únicos colores "de marca"; los demás que
 * aparecen en la app son derivados de estos (más claros o más oscuros) o
 * colores con significado, que no se tocan: rojo, ámbar y verde de las
 * puntuaciones, los avisos de error y de éxito, y el amarillo que destaca
 * las ideas (UX-02).
 */
export const PALETTE = {
  navy: "#183140",
  slate: "#72828C",
  mist: "#F2F2F2",
  silver: "#BFBFBF",
  ink: "#0D0D0D",
} as const;

/**
 * La línea de los gráficos: un verde azulado vivo, más alegre que el azul noche de la marca y de
 * su misma familia. Comprobado con el validador de paletas: dentro de la banda de luminosidad,
 * con viveza suficiente y contraste 3,4:1 sobre la tarjeta blanca. No es verde "bien" ni rojo
 * "mal": esos significados son de las bandas de puntuación.
 */
export const CHART_ACCENT = "#0E9AA7";

/**
 * El mismo verde azulado, más oscuro, para lo que lleva texto blanco encima
 * (botones de acción, chips elegidos): así llega al contraste AA (4,9:1). Es el
 * color "vivo" de la app; los de significado (bandas de puntuación, error,
 * éxito, el amarillo de las ideas) siguen reservados para lo suyo.
 */
export const ACCENT = "#0B7C86";

/**
 * Bordes de tarjetas y separadores: un gris muy claro con un punto del azul de
 * la marca, más suave que el plateado de la paleta.
 */
const SOFT_BORDER = "#DDE2E5";

/**
 * Texto secundario: el gris azulado de la paleta, oscurecido. Tal cual
 * (#72828C) no llega al contraste AA sobre fondo claro (3,9:1 y hacen falta
 * 4,5:1); este tono sí (6,6:1 sobre blanco).
 */
const SLATE_TEXT = "#4F5E67";

/**
 * Tema explícito en modo claro. Sin esto (y sin ThemeProvider/CssBaseline
 * en main.tsx), el `color-scheme: light` de index.css y los componentes de
 * MUI podían quedar desincronizados con el modo oscuro del navegador.
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: PALETTE.navy, contrastText: PALETTE.mist },
    secondary: { main: ACCENT, contrastText: "#FFFFFF" },
    text: { primary: PALETTE.ink, secondary: SLATE_TEXT },
    background: { default: PALETTE.mist, paper: "#FFFFFF" },
    divider: SOFT_BORDER,
  },
  components: {
    // El título de cada página (un h1, sea cual sea su variante), en negrita.
    MuiTypography: { styleOverrides: { root: { "&:is(h1)": { fontWeight: 700 } } } },
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
    primary: { main: PALETTE.mist },
    text: { primary: PALETTE.mist, secondary: PALETTE.silver },
    background: { default: PALETTE.navy, paper: "#1F3D4F" },
  },
});
