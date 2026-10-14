import { Component, type ErrorInfo, type ReactNode } from "react";

interface LoadErrorBoundaryProps {
  /** Lo que se enseña en lugar de la parte que falló. */
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Si una parte de la página que se carga aparte (`lazy`) no se puede descargar
 * o falla al pintarse, se enseña `fallback` en su lugar y el resto de la página
 * sigue funcionando. Sin esto, React desmonta toda la aplicación y la pantalla
 * se queda en blanco (fallo real del 14 oct.: el mapa de RF-49 con una caché de
 * Vite desfasada; en producción pasaría con un trozo de un despliegue anterior).
 * React solo permite capturar errores de pintado con un componente de clase.
 */
export class LoadErrorBoundary extends Component<LoadErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("No se pudo cargar una parte de la página", error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
