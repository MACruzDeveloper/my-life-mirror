import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

/**
 * Registro único de las piezas de Apache ECharts que usa la app (importación
 * por partes: el paquete completo pesa varias veces más). Cada plantilla nueva
 * (p. ej. un radar para RF-15) añade aquí su tipo de gráfico. Render en SVG:
 * más nítido y ligero que canvas para gráficos pequeños.
 */
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

export { echarts };
