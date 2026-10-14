import { createTheme } from "@mui/material/styles";

/**
 * La paleta de la app, "Black Mirror" (elegida por el autor, 14 oct. 2026;
 * sustituye a la del 12 oct.): cinco tonos, del negro azulado al blanco frío.
 * Son los únicos colores "de marca"; los demás que aparecen en la app son
 * derivados de estos (más claros o más oscuros) o colores con significado, que
 * no se tocan: rojo, naranja, ámbar y verde de las puntuaciones, los avisos de
 * error y de éxito, y el amarillo que destaca las ideas (UX-02).
 */
export const PALETTE = {
  /** Midnight Black: el texto. */
  midnight: "#00020C",
  /** Anti-Flash White: el fondo de las páginas. */
  antiFlash: "#F3F1F4",
  /** Loblolly: bordes, separadores y tierras del mapa. */
  loblolly: "#BBC9D2",
  /** Country Blue: el color vivo (acento). */
  countryBlue: "#6B9EA8",
  /** Rich Black: la cabecera y los botones principales. */
  richBlack: "#001312",
} as const;

/**
 * El acento para líneas y superficies (gráficos, países visitados, la línea de
 * la cabecera): Country Blue un punto más oscuro, para llegar a 3:1 sobre blanco
 * (los elementos gráficos lo necesitan; el tono tal cual se queda en 2,9:1).
 */
export const CHART_ACCENT = "#5F929C";

/**
 * Country Blue oscurecido para lo que lleva texto blanco encima (botones de
 * acción, chips elegidos): contraste AA (4,6:1). Es `secondary` en el tema.
 */
export const ACCENT = "#4A7C86";

/** Un tinte muy claro de Loblolly: fondos de bloques que se distinguen del de la página. */
export const PALE_TINT = "#E4EAEE";

/** Bordes de tarjetas y separadores: Loblolly aclarado, suave. */
const SOFT_BORDER = "#DCE3E8";

/**
 * Texto secundario: un gris azulado oscuro de la familia de Loblolly y Country
 * Blue, con contraste AA sobre el fondo y sobre blanco (6,7:1 sobre blanco).
 */
export const TEXT_SECONDARY = "#4A5A63";

/**
 * Tema explícito en modo claro. Sin esto (y sin ThemeProvider/CssBaseline
 * en main.tsx), el `color-scheme: light` de index.css y los componentes de
 * MUI podían quedar desincronizados con el modo oscuro del navegador.
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: PALETTE.richBlack, contrastText: PALETTE.antiFlash },
    secondary: { main: ACCENT, contrastText: "#FFFFFF" },
    text: { primary: PALETTE.midnight, secondary: TEXT_SECONDARY },
    background: { default: PALETTE.antiFlash, paper: "#FFFFFF" },
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
    primary: { main: PALETTE.antiFlash },
    text: { primary: PALETTE.antiFlash, secondary: PALETTE.loblolly },
    background: { default: PALETTE.richBlack, paper: "#0E2523" },
  },
});
