import Box from "@mui/material/Box";

/**
 * Una imagen de fondo que no se mueve mientras el contenido se desplaza sobre ella
 * (UX-08). Es decorativa: no se anuncia. Lleva una capa encima (`overlay`, un
 * degradado CSS) para que lo que va delante se lea.
 *
 * Dentro de un contenedor con `clip-path: inset(0)` queda recortada a ese
 * contenedor: es lo que da el efecto de cortina entre dos imágenes, también en
 * iOS, donde `background-attachment: fixed` no funciona. Sin ese contenedor,
 * ocupa toda la pantalla detrás de la página.
 *
 * Quien pide menos movimiento en su dispositivo ve la imagen desplazarse con la
 * página, sin el efecto.
 */
export function FixedBackdrop({ mobile, desktop, overlay, fallbackColor }: { mobile: string; desktop: string; overlay: string; fallbackColor: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundColor: fallbackColor,
        backgroundImage: { xs: `${overlay}, url(${mobile})`, sm: `${overlay}, url(${desktop})` },
        backgroundSize: "cover",
        backgroundPosition: "center",
        "@media (prefers-reduced-motion: reduce)": { position: "absolute" },
      }}
    />
  );
}
